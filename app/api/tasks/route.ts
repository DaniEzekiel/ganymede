import { NextResponse } from "next/server";
import { googleFetch } from "../../lib/google";

export const dynamic = "force-dynamic";

type GTask = {
  id: string;
  title?: string;
  status?: "needsAction" | "completed";
  due?: string;
  notes?: string;
  updated?: string;
};
type GTasksList = { items?: GTask[] };

function shape(t: GTask) {
  return {
    id: t.id,
    label: t.title ?? "",
    done: t.status === "completed",
    meta: t.due ? new Date(t.due).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
  };
}

export async function GET() {
  try {
    const res = await googleFetch(
      "/tasks/v1/lists/@default/tasks?showCompleted=true&showHidden=false&maxResults=100",
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 120)}`);
    }
    const data = (await res.json()) as GTasksList;
    const tasks = (data.items ?? []).map(shape);
    return NextResponse.json({ configured: true, tasks });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_connected") return NextResponse.json({ configured: false });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { title?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const res = await googleFetch("/tasks/v1/lists/@default/tasks", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`upstream ${res.status}: ${text.slice(0, 120)}`);
    }
    const created = (await res.json()) as GTask;
    return NextResponse.json({ task: shape(created) });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "not_connected") return NextResponse.json({ error: "not_connected" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
