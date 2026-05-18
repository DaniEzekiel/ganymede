import { OAuth2Client, type Credentials } from "google-auth-library";
import { readConfig, writeGoogleTokens, clearGoogleTokens, type GoogleAuth } from "./config";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
];

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function makeOAuthClient(): OAuth2Client {
  return new OAuth2Client({
    clientId: envOrThrow("GOOGLE_CLIENT_ID"),
    clientSecret: envOrThrow("GOOGLE_CLIENT_SECRET"),
    redirectUri: envOrThrow("GOOGLE_REDIRECT_URI"),
  });
}

export async function getAuthorizedClient(): Promise<OAuth2Client | null> {
  const cfg = await readConfig();
  if (!cfg.google?.tokens?.refresh_token) return null;
  const client = makeOAuthClient();
  client.setCredentials(cfg.google.tokens);
  client.on("tokens", async (next) => {
    const merged: Credentials = { ...cfg.google!.tokens, ...next };
    await writeGoogleTokens(merged, cfg.google!.email);
  });
  return client;
}

export async function googleFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const client = await getAuthorizedClient();
  if (!client) throw new Error("not_connected");
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("no_access_token");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`https://www.googleapis.com${path}`, { ...init, headers, cache: "no-store" });
}

export async function disconnectGoogle(): Promise<void> {
  const cfg = await readConfig();
  const refresh = cfg.google?.tokens?.refresh_token;
  if (refresh) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
        method: "POST",
      });
    } catch {}
  }
  await clearGoogleTokens();
}

export function isConnected(g?: GoogleAuth): boolean {
  return Boolean(g?.tokens?.refresh_token);
}
