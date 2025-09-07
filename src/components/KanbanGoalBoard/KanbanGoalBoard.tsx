"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  MeasuringStrategy, // ✅ enum, not string
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Goal, Status } from "@/types/goal";
import { toWeekKey } from "@/lib/week";
import WeekSwitcher from "@/components/WeekSwitcher/WeekSwitcher";
import AddGoalForm from "@/components/AddGoalForm/AddGoalForm";
import { FaPlus } from "react-icons/fa";
import Modal from "@/components/Modal/Modal";
import Column from "@/components/Kanban/Column";
import EditGoalForm from "@/components/EditGoalForm/EditGoalForm";
import { CardOverlay } from "@/components/Kanban/Card";

export default function KanbanBoard() {
  const [weekKey, setWeekKey] = useState<string>(toWeekKey());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  // Drag overlay state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | undefined>(
    undefined
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const fetchGoals = async (wk = weekKey) => {
    setLoading(true);
    const res = await fetch(`/api/goals?weekKey=${wk}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
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
      changed.map(async (g) => {
        const res = await fetch(`/api/goals/${g._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ status: g.status, order: g.order }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Failed to update ${g._id}`);
        }
      })
    );
  };

  const onDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this goal? This action can't be undone."
      )
    )
      return;
    const prev = goals;
    setGoals((gs) => gs.filter((g) => g._id !== id));
    const res = await fetch(`/api/goals/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) setGoals(prev);
  };

  const onEdit = (g: Goal) => setEditing(g);

  // ---- DnD handlers ----
  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    const w =
      event.active.rect.current?.translated?.width ??
      event.active.rect.current?.initial?.width;
    setOverlayWidth(typeof w === "number" ? w : undefined);
  };

  // ⭐ NEW: live reordering across columns while dragging
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const dragged = goals.find((g) => g._id === activeId);
    if (!dragged) return;

    const overGoal = goals.find((g) => g._id === overId);
    const containerIds: Status[] = ["todo", "in-progress", "done"];

    let targetStatus: Status | null = null;
    if (overGoal) targetStatus = overGoal.status as Status;
    else if (containerIds.includes(overId as Status))
      targetStatus = overId as Status;
    else if (over.data?.current?.type === "container")
      targetStatus = (over.data.current.status ?? overId) as Status;

    if (!targetStatus) return;

    const sourceStatus = dragged.status as Status;
    if (sourceStatus === targetStatus && overGoal) {
      // reorder within same list while hovering different item
      const list = goals
        .filter((g) => g.status === sourceStatus)
        .sort((a, b) => a.order - b.order);
      const oldIndex = list.findIndex((g) => g._id === activeId);
      const newIndex = list.findIndex((g) => g._id === overId);
      if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0) return;

      const moved = arrayMove(list, oldIndex, newIndex).map((g, i) => ({
        ...g,
        order: (i + 1) * 1000,
      }));
      const next = goals.map((g) => {
        if (g.status !== sourceStatus) return g;
        const updated = moved.find((m) => m._id === g._id);
        return updated ?? g;
      });
      setGoals(next);
      return;
    }

    // moving across lists (or into empty space in a list)
    if (sourceStatus !== targetStatus || !overGoal) {
      const lists: Record<Status, Goal[]> = {
        todo: byStatus.todo.slice(),
        "in-progress": byStatus["in-progress"].slice(),
        done: byStatus.done.slice(),
      };

      // remove from source
      const src = lists[sourceStatus];
      const fromIndex = src.findIndex((g) => g._id === activeId);
      if (fromIndex < 0) return;
      const [removed] = src.splice(fromIndex, 1);

      // insert into target
      const tgt = lists[targetStatus];
      let insertIndex = tgt.length;
      if (overGoal) {
        const overIdx = tgt.findIndex((g) => g._id === overId);
        insertIndex = overIdx < 0 ? tgt.length : overIdx;
      }
      tgt.splice(insertIndex, 0, { ...removed, status: targetStatus });

      // only update in-memory order numbers for UI smoothness
      const normalize = (arr: Goal[]) =>
        arr.map((g, i) => ({ ...g, order: (i + 1) * 1000 }));
      const next = [
        ...normalize(lists.todo),
        ...normalize(lists["in-progress"]),
        ...normalize(lists.done),
      ];

      setGoals(next);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverlayWidth(undefined);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const dragged = goals.find((g) => g._id === activeId);
    if (!dragged) return;

    const overGoal = goals.find((g) => g._id === overId);
    const containerIds: Status[] = ["todo", "in-progress", "done"];

    let targetStatus: Status | null = null;
    if (overGoal) targetStatus = overGoal.status as Status;
    else if (containerIds.includes(overId as Status))
      targetStatus = overId as Status;
    else if (over.data?.current?.type === "container")
      targetStatus = (over.data.current.status ?? overId) as Status;
    if (!targetStatus) return;

    const sourceStatus = dragged.status as Status;

    const lists: Record<Status, Goal[]> = {
      todo: goals
        .filter((g) => g.status === "todo")
        .sort((a, b) => a.order - b.order),
      "in-progress": goals
        .filter((g) => g.status === "in-progress")
        .sort((a, b) => a.order - b.order),
      done: goals
        .filter((g) => g.status === "done")
        .sort((a, b) => a.order - b.order),
    };

    // remove from source
    const src = lists[sourceStatus];
    const fromIndex = src.findIndex((g) => g._id === activeId);
    const [removed] = src.splice(fromIndex, 1);

    // insert into target
    const tgt = lists[targetStatus];
    let insertIndex = tgt.length;
    if (overGoal) insertIndex = tgt.findIndex((g) => g._id === overId);
    tgt.splice(insertIndex, 0, { ...removed, status: targetStatus });

    // normalize + persist
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

  const onDragCancel = () => {
    setActiveId(null);
    setOverlayWidth(undefined);
    // Optionally: refetch to reset positions
    // fetchGoals();
  };

  const activeGoal = activeId ? goals.find((g) => g._id === activeId) : null;

  return (
    <>
      <div className="space-y-6 px-4">
        <div className="flex items-center justify-between">
          <WeekSwitcher weekKey={weekKey} onChange={(wk) => setWeekKey(wk)} />
          <div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/10 hover:bg-emerald-700 hover:shadow active:bg-emerald-800 active:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
            collisionDetection={closestCorners}
            measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            onDragStart={onDragStart}
            onDragOver={onDragOver} // ⭐ makes other column make space
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
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

            <DragOverlay dropAnimation={null}>
              {activeGoal ? (
                <CardOverlay
                  goal={activeGoal}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  width={overlayWidth}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <AddGoalForm
          weekKey={weekKey}
          onCreated={() => fetchGoals()}
          onClose={() => setOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing ? (
          <EditGoalForm
            goal={editing}
            onSaved={() => fetchGoals()}
            onClose={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}
