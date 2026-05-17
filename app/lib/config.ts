import { promises as fs } from "node:fs";
import path from "node:path";

export async function dirExists(p: string): Promise<boolean> {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "config.json");

export type Config = { calendarUrl?: string; photosUrl?: string };

export async function readConfig(): Promise<Config> {
  try {
    const text = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Config) : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw err;
  }
}

async function writeConfig(cfg: Config): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export async function writeCalendarUrl(url: string): Promise<void> {
  const cfg = await readConfig();
  cfg.calendarUrl = url;
  await writeConfig(cfg);
}

export async function clearCalendarUrl(): Promise<void> {
  const cfg = await readConfig();
  delete cfg.calendarUrl;
  await writeConfig(cfg);
}

export async function writePhotosUrl(url: string): Promise<void> {
  const cfg = await readConfig();
  cfg.photosUrl = url;
  await writeConfig(cfg);
}

export async function clearPhotosUrl(): Promise<void> {
  const cfg = await readConfig();
  delete cfg.photosUrl;
  await writeConfig(cfg);
}

export function isValidICloudShareUrl(input: unknown): input is string {
  if (typeof input !== "string") return false;
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return false;
    if (u.host === "www.icloud.com" && u.pathname.startsWith("/sharedalbum/")) return true;
    if (u.host === "share.icloud.com" && u.pathname.startsWith("/photos/")) return true;
    return false;
  } catch {
    return false;
  }
}

export function maskICloudUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname.split("/").slice(0, 2).join("/")}/…`;
  } catch {
    return "icloud.com/…";
  }
}

export function isValidGoogleIcsUrl(input: unknown): input is string {
  if (typeof input !== "string") return false;
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return false;
    if (u.host !== "calendar.google.com") return false;
    if (!u.pathname.endsWith(".ics")) return false;
    return true;
  } catch {
    return false;
  }
}

export function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    const last = segs[segs.length - 1] ?? "";
    return `${u.host}/…/${last}`;
  } catch {
    return "calendar.google.com/…";
  }
}
