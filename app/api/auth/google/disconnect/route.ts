import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { disconnectGoogle } from "../../../../lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  await disconnectGoogle();
  revalidatePath("/api/calendar");
  revalidatePath("/api/tasks");
  revalidatePath("/api/config");
  return NextResponse.json({ ok: true });
}
