"use client";
import { useState } from "react";
import type { Goal } from "@/types/goal";

export default function EditGoalForm({
  goal,
  onSaved,
  onClose,
}: {
  goal: Goal;
  onSaved: () => void; // e.g., refetch
  onClose: () => void; // close modal
}) {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || "");
  const [dueDate, setDueDate] = useState(
    goal.dueDate ? goal.dueDate.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${goal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to update goal");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-lg font-semibold">Edit Goal</h3>

      <input
        autoFocus
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center gap-2">
        <input
          type="date"
          className="rounded-lg border px-3 py-2"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
