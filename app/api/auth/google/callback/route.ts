import { NextResponse } from "next/server";
import { makeOAuthClient } from "../../../../lib/google";
import { writeGoogleTokens } from "../../../../lib/config";

export const dynamic = "force-dynamic";

type TokenInfo = { email?: string };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?google=error&reason=${encodeURIComponent(error)}`, url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?google=error&reason=missing_code", url.origin));
  }

  const stateCookie = req.headers.get("cookie")?.match(/(?:^|;\s*)g_oauth_state=([^;]+)/)?.[1];
  if (!state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(new URL("/?google=error&reason=bad_state", url.origin));
  }

  try {
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/?google=error&reason=no_refresh_token", url.origin),
      );
    }
    let email: string | undefined;
    try {
      client.setCredentials(tokens);
      const access = (await client.getAccessToken()).token;
      if (access) {
        const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (info.ok) email = ((await info.json()) as TokenInfo).email;
      }
    } catch {}
    await writeGoogleTokens(tokens, email);
    const res = NextResponse.redirect(new URL("/?google=connected", url.origin));
    res.cookies.set("g_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    const reason = encodeURIComponent((err as Error).message || "exchange_failed");
    return NextResponse.redirect(new URL(`/?google=error&reason=${reason}`, url.origin));
  }
}
