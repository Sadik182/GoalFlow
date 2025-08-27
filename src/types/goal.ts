// types/goal.ts
export type Status = "todo" | "in-progress" | "done";

export interface Goal {
  _id?: string; // MongoDB ObjectId as string
  title: string;
  description?: string;
  status: Status;
  weekKey: string; // e.g. "2025-W35"
  order: number; // for sorting inside a column
  dueDate?: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
  userId?: string; // for future auth support
}
