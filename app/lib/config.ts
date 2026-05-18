import { promises as fs } from "node:fs";
import path from "node:path";
import type { Credentials } from "google-auth-library";

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

export type GoogleAuth = { tokens: Credentials; email?: string };
export type Config = { photosUrl?: string; google?: GoogleAuth; appleCalendarUrl?: string };

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

export async function writeGoogleTokens(tokens: Credentials, email?: string): Promise<void> {
  const cfg = await readConfig();
  cfg.google = { tokens, email: email ?? cfg.google?.email };
  await writeConfig(cfg);
}

export async function clearGoogleTokens(): Promise<void> {
  const cfg = await readConfig();
  delete cfg.google;
  await writeConfig(cfg);
}

export async function writeAppleCalendarUrl(url: string): Promise<void> {
  const cfg = await readConfig();
  cfg.appleCalendarUrl = url;
  await writeConfig(cfg);
}

export async function clearAppleCalendarUrl(): Promise<void> {
  const cfg = await readConfig();
  delete cfg.appleCalendarUrl;
  await writeConfig(cfg);
}

export function normalizeICloudCalendarUrl(input: string): string {
  return input.trim().replace(/^webcal:\/\//i, "https://");
}

export function isValidICloudCalendarUrl(input: unknown): input is string {
  if (typeof input !== "string") return false;
  try {
    const u = new URL(normalizeICloudCalendarUrl(input));
    if (u.protocol !== "https:") return false;
    if (!/^p\d+-caldav\.icloud\.com$/i.test(u.host)) return false;
    if (!u.pathname.startsWith("/published/")) return false;
    return true;
  } catch {
    return false;
  }
}

export function maskICloudCalendarUrl(url: string): string {
  try {
    const u = new URL(normalizeICloudCalendarUrl(url));
    return `${u.host}/published/…`;
  } catch {
    return "icloud.com/published/…";
  }
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

