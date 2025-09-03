"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners, // ✅ use better collision strategy
} from "@dnd-kit/core";
import type { Goal, Status } from "@/types/goal";
import { toWeekKey } from "@/lib/week";
import WeekSwitcher from "@/components/WeekSwitcher/WeekSwitcher";
import AddGoalForm from "@/components/AddGoalForm/AddGoalForm";
import { FaReact, FaPlus } from "react-icons/fa";
import Modal from "@/components/Modal/Modal";
import Column from "@/components/Kanban/Column";

export default function KanbanBoard() {
  const [weekKey, setWeekKey] = useState<string>(toWeekKey());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const fetchGoals = async (wk = weekKey) => {
    setLoading(true);
    const res = await fetch(`/api/goals?weekKey=${wk}`, { cache: "no-store" });
    const json = await res.json();
    setGoals(json.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey]);

  const byStatus = useMemo(
    () => ({
      todo: goals
        .filter((g) => g.status === "todo")
        .sort((a, b) => a.order - b.order),
      "in-progress": goals
        .filter((g) => g.status === "in-progress")
        .sort((a, b) => a.order - b.order),
      done: goals
        .filter((g) => g.status === "done")
        .sort((a, b) => a.order - b.order),
    }),
    [goals]
  );

  const persistOrders = async (changed: Goal[]) => {
    await Promise.all(
      changed.map((g) =>
        fetch(`/api/goals/${g._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: g.status, order: g.order }),
        })
      )
    );
  };

  const onDelete = async (id: string) => {
    const prev = goals;
    setGoals((gs) => gs.filter((g) => g._id !== id));
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!res.ok) setGoals(prev);
  };

  const onEdit = async (g: Goal) => {
    const title = window.prompt("Edit title", g.title);
    if (title == null) return;
    const description =
      window.prompt("Edit description", g.description || "") || "";
    const prev = goals;
    const next = goals.map((x) =>
      x._id === g._id ? { ...x, title, description } : x
    );
    setGoals(next);
    const res = await fetch(`/api/goals/${g._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) setGoals(prev);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const dragged = goals.find((g) => g._id === activeId);
    if (!dragged) return;

    // Determine target column
    const overGoal = goals.find((g) => g._id === overId);
    const containerIds: Status[] = ["todo", "in-progress", "done"];

    let targetStatus: Status | null = null;
    if (overGoal) {
      targetStatus = overGoal.status as Status;
    } else if (containerIds.includes(overId as Status)) {
      targetStatus = overId as Status;
    } else if (over.data?.current?.type === "container") {
      targetStatus = (over.data.current.status ?? overId) as Status;
    }
    if (!targetStatus) return;

    const sourceStatus = dragged.status as Status;

    const lists: Record<Status, Goal[]> = {
      todo: [...byStatus.todo],
      "in-progress": [...byStatus["in-progress"]],
      done: [...byStatus.done],
    };

    // Remove from source
    const src = lists[sourceStatus];
    const fromIndex = src.findIndex((g) => g._id === activeId);
    const [removed] = src.splice(fromIndex, 1);

    // Insert into target (before the hovered goal if present)
    const tgt = lists[targetStatus];
    let insertIndex = tgt.length;
    if (overGoal) insertIndex = tgt.findIndex((g) => g._id === overId);
    tgt.splice(insertIndex, 0, { ...removed, status: targetStatus });

    // Normalize order per column (1000, 2000, …)
    const normalize = (arr: Goal[]) =>
      arr.map((g, i) => ({ ...g, order: (i + 1) * 1000 }));
    const nextTodo = normalize(lists.todo);
    const nextProg = normalize(lists["in-progress"]);
    const nextDone = normalize(lists.done);
    const nextGoals: Goal[] = [...nextTodo, ...nextProg, ...nextDone];

    setGoals(nextGoals); // optimistic
    const changed = [
      ...nextGoals.filter((g) => g.status === sourceStatus),
      ...nextGoals.filter((g) => g.status === targetStatus),
    ];
    await persistOrders(changed);
  };

  return (
    <>
      <div className="space-y-6 px-4">
        <div className="flex items-center justify-between">
          <WeekSwitcher weekKey={weekKey} onChange={(wk) => setWeekKey(wk)} />

          <div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/10
             hover:bg-emerald-700 hover:shadow
             active:bg-emerald-800 active:shadow-sm
             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60
             disabled:opacity-60 disabled:cursor-not-allowed
             transition-colors cursor-pointer"
            >
              <FaPlus className="h-4 w-4" aria-hidden />
              <span>Add New Goal</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading goals…</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners} // ✅ key for cross-column
            onDragEnd={onDragEnd}
          >
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              <Column
                id="todo"
                title="To Do"
                items={byStatus.todo}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              <Column
                id="in-progress"
                title="In Progress"
                items={byStatus["in-progress"]}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              <Column
                id="done"
                title="Done"
                items={byStatus.done}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </DndContext>
        )}
      </div>

      {/* Modal with the form */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <AddGoalForm
          weekKey={weekKey}
          onCreated={() => fetchGoals()} // refresh Kanban after add
          onClose={() => setOpen(false)} // close modal after add/cancel
        />
      </Modal>
    </>
  );
}
