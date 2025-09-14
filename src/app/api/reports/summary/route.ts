// app/api/reports/summary/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = asDate(url.searchParams.get("from"));
    const to = asDate(url.searchParams.get("to"));
    const now = new Date();

    const db = await getDb();
    const goals = db.collection("goals");

    // Build reusable match stages
    const rangeMatchCreated =
      from && to
        ? { createdAt: { $gte: from, $lt: to } }
        : from
        ? { createdAt: { $gte: from } }
        : to
        ? { createdAt: { $lt: to } }
        : {};

    const rangeMatchCompleted =
      from && to
        ? { completedAt: { $gte: from, $lt: to } }
        : from
        ? { completedAt: { $gte: from } }
        : to
        ? { completedAt: { $lt: to } }
        : {};

    // ---- Totals ----
    const [createdTotal, completedTotal, overdueTotal, snapshotByStatus] =
      await Promise.all([
        goals.countDocuments({ ...rangeMatchCreated }),
        goals.countDocuments({
          completedAt: { $exists: true, $ne: null },
          ...rangeMatchCompleted,
        }),
        goals.countDocuments({
          dueDate: { $lt: now },
          status: { $ne: "done" },
        }),
        goals
          .aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
          ])
          .toArray(),
      ]);

    // ---- Average cycle time (days) for completed in range ----
    const cycleAgg = await goals
      .aggregate([
        {
          $match: {
            completedAt: { $exists: true, $ne: null },
            ...rangeMatchCompleted,
          },
        },
        {
          $project: {
            cycleDays: {
              $divide: [
                { $subtract: ["$completedAt", "$createdAt"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        { $group: { _id: null, avgDays: { $avg: "$cycleDays" } } },
      ])
      .toArray();
    const avgCycleDays = cycleAgg[0]?.avgDays ?? null;

    // ---- Created vs Completed per week (ISO week) ----
    const createdByWeek = await goals
      .aggregate([
        { $match: { ...rangeMatchCreated } },
        {
          $project: {
            weekKey: 1, // you already store weekKey like "2025-W35"
          },
        },
        { $group: { _id: "$weekKey", created: { $sum: 1 } } },
        { $project: { _id: 0, weekKey: "$_id", created: 1 } },
        { $sort: { weekKey: 1 } },
      ])
      .toArray();

    const completedByWeek = await goals
      .aggregate([
        {
          $match: {
            completedAt: { $exists: true, $ne: null },
            ...rangeMatchCompleted,
          },
        },
        {
          $project: {
            weekKey: {
              $dateToString: { date: "$completedAt", format: "%G-W%V" }, // ISO week
            },
          },
        },
        { $group: { _id: "$weekKey", completed: { $sum: 1 } } },
        { $project: { _id: 0, weekKey: "$_id", completed: 1 } },
        { $sort: { weekKey: 1 } },
      ])
      .toArray();

    // Merge created/completed lines by weekKey
    const trendMap = new Map<
      string,
      { weekKey: string; created: number; completed: number }
    >();
    createdByWeek.forEach((r) => {
      trendMap.set(r.weekKey, {
        weekKey: r.weekKey,
        created: r.created,
        completed: 0,
      });
    });
    completedByWeek.forEach((r) => {
      const prev = trendMap.get(r.weekKey) || {
        weekKey: r.weekKey,
        created: 0,
        completed: 0,
      };
      prev.completed = r.completed;
      trendMap.set(r.weekKey, prev);
    });
    const trend = Array.from(trendMap.values()).sort((a, b) =>
      a.weekKey.localeCompare(b.weekKey)
    );

    // ---- Snapshot by status (for pie/bar) ----
    const byStatus = snapshotByStatus;

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          created: createdTotal,
          completed: completedTotal,
          overdue: overdueTotal,
          completionRate:
            createdTotal > 0
              ? Math.round((completedTotal / createdTotal) * 100)
              : 0,
          avgCycleDays:
            avgCycleDays != null ? Number(avgCycleDays.toFixed(1)) : null,
        },
        byStatus, // [{status, count}]
        trend, // [{weekKey, created, completed}]
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
