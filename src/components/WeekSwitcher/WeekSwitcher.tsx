"use client";
import { shiftWeek } from "@/lib/week";

export default function WeekSwitcher({
  weekKey,
  onChange,
}: {
  weekKey: string;
  onChange: (wk: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-1 rounded border"
        onClick={() => onChange(shiftWeek(weekKey, -1))}
      >
        Prev
      </button>
      <span className="text-sm font-medium">{weekKey}</span>
      <button
        className="px-3 py-1 rounded border"
        onClick={() => onChange(shiftWeek(weekKey, 1))}
      >
        Next
      </button>
    </div>
  );
}
