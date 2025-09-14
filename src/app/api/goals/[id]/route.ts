// app/api/goals/[id]/route.ts
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
    const { id } = await context.params; // Next 15: await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const $set: Record<string, any> = { updatedAt: new Date() };
    const $unset: Record<string, "" | true> = {};

    if (typeof body.title === "string") $set.title = body.title.trim();
    if (typeof body.description === "string")
      $set.description = body.description.trim();
    if (typeof body.status === "string") $set.status = body.status;
    if (typeof body.order === "number") $set.order = body.order;

    // Optional: allow dueDate updates via PATCH
    if ("dueDate" in body) {
      // accept "", null, or a date string
      if (body.dueDate) $set.dueDate = new Date(body.dueDate);
      else {
        // remove dueDate if falsy
        $unset.dueDate = "";
      }
    }

    // ✅ completedAt handling
    if (typeof body.status === "string") {
      if (body.status === "done") {
        $set.completedAt = new Date();
      } else {
        // moving out of done → clear completedAt
        $unset.completedAt = "";
      }
    }

    if (
      Object.keys($set).length === 1 && // only updatedAt present
      Object.keys($unset).length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Nothing to update" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const res = await db.collection("goals").updateOne(
      { _id: new ObjectId(id) },
      {
        ...($set ? { $set } : {}),
        ...(Object.keys($unset).length ? { $unset } : {}),
      }
    );

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
    const { id } = await context.params; // Next 15: await params
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
