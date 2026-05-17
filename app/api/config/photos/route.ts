import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  writePhotosUrl,
  clearPhotosUrl,
  isValidICloudShareUrl,
} from "../../../lib/config";
import { extractToken } from "../../../lib/icloudShared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const raw = (body as { url?: unknown })?.url;
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!isValidICloudShareUrl(url) || !extractToken(url)) {
    return NextResponse.json(
      { error: "Must be an https://www.icloud.com/sharedalbum/... or https://share.icloud.com/photos/... URL" },
      { status: 400 },
    );
  }
  await writePhotosUrl(url);
  revalidatePath("/api/photos");
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearPhotosUrl();
  revalidatePath("/api/photos");
  return NextResponse.json({ ok: true });
}
