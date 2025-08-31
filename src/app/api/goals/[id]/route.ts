import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

// PATCH /api/goals/:id
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const update: any = {};
    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.description === "string")
      update.description = body.description.trim();
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.order === "number") update.order = body.order;

    if (!Object.keys(update).length) {
      return NextResponse.json(
        { ok: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    update.updatedAt = new Date();

    const db = await getDb();
    const res = await db
      .collection("goals")
      .updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (!res.matchedCount) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PATCH /api/goals/:id error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/:id
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const res = await db
      .collection("goals")
      .deleteOne({ _id: new ObjectId(id) });

    if (!res.deletedCount) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/goals/:id error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to delete goal" },
      { status: 500 }
    );
  }
}
