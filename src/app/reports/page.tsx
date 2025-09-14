"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Status = "todo" | "in-progress" | "done";

type Summary = {
  totals: {
    created: number;
    completed: number;
    overdue: number;
    completionRate: number; // %
    avgCycleDays: number | null;
  };
  byStatus: { status: Status; count: number }[];
  trend: { weekKey: string; created: number; completed: number }[];
};

export default function ReportsPage() {
  const [from, setFrom] = useState<string>(""); // e.g. "2025-08-01"
  const [to, setTo] = useState<string>(""); // e.g. "2025-09-14"
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports/summary?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const COLORS = ["#22c55e", "#06b6d4", "#94a3b8"]; // emerald, cyan, slate

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <button
          onClick={fetchSummary}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Apply
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi title="Created" value={data?.totals.created ?? 0} />
        <Kpi title="Completed" value={data?.totals.completed ?? 0} />
        <Kpi title="Overdue" value={data?.totals.overdue ?? 0} />
        <Kpi
          title="Completion Rate"
          value={`${data?.totals.completionRate ?? 0}%`}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          title="Avg Cycle Time"
          value={
            data?.totals.avgCycleDays != null
              ? `${data?.totals.avgCycleDays} days`
              : "—"
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Trend: Created vs Completed by week */}
        <div className="col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Throughput by Week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekKey" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill={COLORS[1]} name="Created" />
                <Bar dataKey="completed" fill={COLORS[0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Snapshot: current status distribution */}
        <div className="col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Current Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="count"
                  data={(data?.byStatus ?? []).sort((a, b) =>
                    a.status.localeCompare(b.status)
                  )}
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {(data?.byStatus ?? []).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
