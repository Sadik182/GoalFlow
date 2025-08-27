"use client";
import { useState } from "react";

export default function AddGoalForm({
  weekKey,
  onCreated,
}: {
  weekKey: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
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
    setLoading(false);
    onCreated();
  };

  return (
    <form
      onSubmit={submit}
      className="p-3 border rounded-xl bg-white shadow-sm space-y-2"
    >
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="New goal title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full border rounded px-3 py-2"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white"
        >
          {loading ? "Adding..." : "Add Goal"}
        </button>
      </div>
    </form>
  );
}
