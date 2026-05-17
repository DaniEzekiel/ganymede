import { promises as fs } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "config.json");

export type Config = { calendarUrl?: string };

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
