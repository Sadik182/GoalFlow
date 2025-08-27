// lib/week.ts
export function getISOWeek(date = new Date()): { year: number; week: number } {
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Thursday determines the year
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: tmp.getUTCFullYear(), week: weekNo };
}

export function toWeekKey(date = new Date()): string {
  const { year, week } = getISOWeek(date);
  return `${year}-W${week}`;
}

export function shiftWeek(weekKey: string, delta: number): string {
  const [y, w] = weekKey.split("-W").map(Number);
  const d = new Date(Date.UTC(y, 0, 1 + (w - 1) * 7));
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return toWeekKey(d);
}
