import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weekKey = searchParams.get("weekKey"); // e.g. 2025-W35

    const db = await getDb(); // DB = GoalFlow
    const query: any = weekKey ? { weekKey } : {};
    const items = await db
      .collection("goals") // <- collection
      .find(query)
      .sort({ status: 1, order: 1, createdAt: -1 })
      .toArray();

    // stringify _id & dates for the client
    const data = items.map((g: any) => ({
      ...g,
      _id: g._id.toString(),
      dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : undefined,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : undefined,
      updatedAt: g.updatedAt ? new Date(g.updatedAt).toISOString() : undefined,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
