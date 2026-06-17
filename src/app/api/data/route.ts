import { NextResponse } from "next/server";
import { readStore, writeStore } from "@/lib/server-store";
import { EMPTY_STATE, type AppData } from "@/lib/types";

// Always run dynamically; we read/write the filesystem.
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readStore();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  let body: Partial<AppData>;
  try {
    body = (await request.json()) as Partial<AppData>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: AppData = { ...EMPTY_STATE, ...body };
  await writeStore(data);
  return NextResponse.json({ ok: true });
}
