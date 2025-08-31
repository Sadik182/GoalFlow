import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

// GET /api/goals?weekKey=2025-W35
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weekKey = searchParams.get("weekKey"); // e.g. 2025-W35

    const db = await getDb(); // DB = GoalFlow
    const query: any = weekKey ? { weekKey } : {};
    const items = await db
      .collection("goals")
      .find(query)
      .sort({ status: 1, order: 1, createdAt: -1 })
      .toArray();

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

// POST /api/goals
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title: string = (body?.title || "").trim();
    const description: string = (body?.description || "").trim();
    const weekKey: string = body?.weekKey;
    const dueDate: string | undefined = body?.dueDate;

    if (!title || !weekKey) {
      return NextResponse.json(
        { ok: false, error: "title and weekKey are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const col = db.collection("goals");

    // default status and next order within (weekKey + status)
    const status: "todo" | "in-progress" | "done" = "todo";
    const last = await col
      .find({ weekKey, status })
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const nextOrder = (last[0]?.order ?? 0) + 1000;

    const now = new Date();
    const doc = {
      title,
      description,
      weekKey,
      status,
      order: nextOrder,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    const res = await col.insertOne(doc);
    return NextResponse.json(
      {
        ok: true,
        id: res.insertedId.toString(),
        data: { ...doc, _id: res.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("POST /api/goals error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to create goal" },
      { status: 500 }
    );
  }
}
