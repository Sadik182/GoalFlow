"use client";
import { useState } from "react";

export default function AddGoalForm({
  weekKey,
  onCreated,
  onClose,
}: {
  weekKey: string;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setLoading(true);
      await fetch(`/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          weekKey,
          dueDate: dueDate || undefined,
        }),
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      onCreated(); // e.g., refetch Kanban data
      onClose(); // close modal
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-lg font-semibold">Add New Goal</h3>
      <input
        className="w-full rounded-lg border px-3 py-2"
        placeholder="New goal title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="w-full rounded-lg border px-3 py-2"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="date"
        className="w-full rounded-lg border px-3 py-2"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <div className="flex items-center gap-2">
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
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Goal"}
          </button>
        </div>
      </div>
    </form>
  );
}
