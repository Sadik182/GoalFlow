"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Goal, Status } from "@/types/goal";
import { toWeekKey } from "@/lib/week";
import WeekSwitcher from "@/components/WeekSwitcher/WeekSwitcher";
import AddGoalForm from "@/components/AddGoalForm/AddGoalForm";

function Card({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: goal._id! });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 rounded-xl bg-white border shadow-sm space-y-1 cursor-grab active:cursor-grabbing"
    >
      <div className="font-medium">{goal.title}</div>
      {goal.description && (
        <div className="text-sm text-gray-600">{goal.description}</div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {goal.dueDate && (
          <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
        )}
        <div className="flex gap-2">
          <button onClick={() => onEdit(goal)} className="underline">
            Edit
          </button>
          <button
            onClick={() => onDelete(goal._id!)}
            className="underline text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Column({
  id,
  title,
  items,
  onEdit,
  onDelete,
}: {
  id: Status;
  title: string;
  items: Goal[];
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "container" },
  });
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-3 p-2 rounded-xl min-h-[200px] border ${
          isOver ? "bg-gray-50" : "bg-transparent"
        }`}
      >
        <SortableContext
          items={items.map((i) => i._id!)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((g) => (
            <Card key={g._id} goal={g} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [weekKey, setWeekKey] = useState<string>(toWeekKey());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

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

    let targetStatus: Status | null = null;
    const overGoal = goals.find((g) => g._id === overId);
    if (overGoal) targetStatus = overGoal.status;
    else if (over.data?.current?.type === "container")
      targetStatus = overId as Status;
    if (!targetStatus) return;

    const sourceStatus = dragged.status;

    const lists: Record<Status, Goal[]> = {
      todo: [...byStatus.todo],
      "in-progress": [...byStatus["in-progress"]],
      done: [...byStatus.done],
    };

    // Remove from source
    const sourceList = lists[sourceStatus];
    const fromIndex = sourceList.findIndex((g) => g._id === activeId);
    const [removed] = sourceList.splice(fromIndex, 1);

    // Insert into target
    const targetList = lists[targetStatus];
    let insertIndex = targetList.length;
    if (overGoal) insertIndex = targetList.findIndex((g) => g._id === overId);
    targetList.splice(insertIndex, 0, { ...removed, status: targetStatus });

    // Normalize order per column (1000, 2000, ...)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">GoalFlow – Weekly Goals</h1>
        <WeekSwitcher weekKey={weekKey} onChange={(wk) => setWeekKey(wk)} />
      </div>

      <AddGoalForm weekKey={weekKey} onCreated={() => fetchGoals()} />

      {loading ? (
        <div className="text-sm text-gray-500">Loading goals…</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
  );
}
