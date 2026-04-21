import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp",
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const dir = process.env.PHOTOS_DIR;
  if (!dir) return NextResponse.json({ error: "PHOTOS_DIR not set" }, { status: 500 });

  const decoded = decodeURIComponent(name);
  if (decoded.includes("/") || decoded.includes("..")) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const full = path.join(dir, decoded);
  try {
    await stat(full);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ext = path.extname(decoded).toLowerCase();
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
