import { NextResponse } from "next/server";
import { googleFetch } from "../../../lib/google";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as { done?: unknown; title?: unknown };
    const patch: Record<string, string> = {};
    if (typeof body.done === "boolean") {
      patch.status = body.done ? "completed" : "needsAction";
      if (!body.done) patch.completed = "";
    }
    if (typeof body.title === "string") patch.title = body.title;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "no fields" }, { status: 400 });
    }
    const res = await googleFetch(`/tasks/v1/lists/@default/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 120)}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_connected") return NextResponse.json({ error: "not_connected" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const res = await googleFetch(`/tasks/v1/lists/@default/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 120)}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_connected") return NextResponse.json({ error: "not_connected" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
