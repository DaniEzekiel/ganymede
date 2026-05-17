type Derivative = { checksum: string; width?: string; height?: string };

type Photo = {
  photoGuid: string;
  caption?: string;
  dateCreated?: string;
  mediaAssetType?: string;
  derivatives: Record<string, Derivative>;
};

type AssetLocation = { url_location: string; url_path: string };

type WebStreamResponse = { photos?: Photo[] };
type AssetUrlsResponse = { items?: Record<string, AssetLocation> };

export type AlbumPhoto = { url: string; title: string; meta: string };

const INITIAL_PARTITION = "p23";
const MAX_REDIRECTS = 4;
const LARGEST_REASONABLE_WIDTH = 2500;

export function extractToken(input: string): string | null {
  const m1 = input.match(/icloud\.com\/sharedalbum\/#?([A-Za-z0-9]+)/);
  if (m1) return m1[1];
  const m2 = input.match(/share\.icloud\.com\/photos\/([A-Za-z0-9]+)/);
  if (m2) return m2[1];
  return null;
}

async function postWithPartition(
  token: string,
  endpoint: "webstream" | "webasseturls",
  body: unknown,
): Promise<{ partition: string; data: unknown }> {
  let partition = INITIAL_PARTITION;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const url = `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.status === 200) {
      return { partition, data: await res.json() };
    }
    if (res.status === 330) {
      let host: string | undefined;
      try {
        const reroute = (await res.json()) as { "X-Apple-MMe-Host"?: string };
        host = reroute["X-Apple-MMe-Host"];
      } catch {
        host = res.headers.get("x-apple-mme-host") ?? undefined;
      }
      const m = host?.match(/^(p\d+)-sharedstreams\.icloud\.com$/);
      if (m) {
        partition = m[1];
        continue;
      }
      throw new Error("iCloud: partition redirect missing host");
    }
    if (res.status === 404) {
      throw new Error("Album not found or no longer shared");
    }
    throw new Error(`iCloud ${endpoint} ${res.status}`);
  }
  throw new Error("iCloud: partition discovery exhausted");
}

function bestChecksum(p: Photo): string | null {
  const sized = Object.entries(p.derivatives)
    .map(([k, v]) => ({ key: k, w: Number(k), checksum: v.checksum }))
    .filter((d) => Number.isFinite(d.w) && d.w > 0 && d.checksum)
    .sort((a, b) => b.w - a.w);
  if (sized.length === 0) return null;
  const target = sized.find((s) => s.w <= LARGEST_REASONABLE_WIDTH) ?? sized[sized.length - 1];
  return target.checksum;
}

function formatMeta(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export async function fetchSharedAlbum(token: string): Promise<AlbumPhoto[]> {
  const { partition, data: streamData } = await postWithPartition(token, "webstream", {
    streamCtag: null,
  });
  const stream = streamData as WebStreamResponse;
  const photos = (stream.photos ?? []).filter((p) => p.mediaAssetType !== "video");
  if (photos.length === 0) return [];

  const byGuid = new Map(photos.map((p) => [p.photoGuid, p] as const));
  const checksumByGuid = new Map<string, string>();
  for (const p of photos) {
    const c = bestChecksum(p);
    if (c) checksumByGuid.set(p.photoGuid, c);
  }

  const guids = [...checksumByGuid.keys()];
  if (guids.length === 0) return [];

  // Re-use the partition discovered during webstream — same album, same host.
  const assetsUrl = `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/webasseturls`;
  const assetsRes = await fetch(assetsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ photoGuids: guids }),
    cache: "no-store",
  });
  if (!assetsRes.ok) throw new Error(`iCloud webasseturls ${assetsRes.status}`);
  const assets = (await assetsRes.json()) as AssetUrlsResponse;
  const items = assets.items ?? {};

  const out: AlbumPhoto[] = [];
  for (const guid of guids) {
    const checksum = checksumByGuid.get(guid)!;
    const loc = items[checksum];
    if (!loc?.url_location || !loc?.url_path) continue;
    const photo = byGuid.get(guid)!;
    out.push({
      url: `https://${loc.url_location}${loc.url_path}`,
      title: photo.caption?.trim() || "Untitled",
      meta: formatMeta(photo.dateCreated),
    });
  }
  return out;
}
