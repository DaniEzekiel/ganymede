import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { GOOGLE_SCOPES, makeOAuthClient } from "../../../../lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = makeOAuthClient();
  const state = randomBytes(16).toString("hex");
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: GOOGLE_SCOPES,
    state,
  });
  const res = NextResponse.redirect(url);
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
