// src/components/Kanban/Card.tsx
"use client";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { FiEdit2, FiTrash2, FiCalendar } from "react-icons/fi";
import type { Goal } from "@/types/goal";

function CardInner({
  goal,
  onEdit,
  onDelete,
  disableActions = false,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  disableActions?: boolean;
}) {
  return (
    <div className="select-none rounded-xl border bg-white p-3 shadow-sm">
      <div className="font-medium">{goal.title}</div>
      {goal.description && (
        <div className="mt-1 text-sm text-gray-600">{goal.description}</div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        {goal.dueDate ? (
          <span className="inline-flex items-center gap-1">
            <FiCalendar className="h-4 w-4" />
            Due {new Date(goal.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button
            onClick={() => !disableActions && onEdit(goal)}
            className={`inline-flex items-center gap-1 hover:underline ${
              disableActions ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <FiEdit2 className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => !disableActions && onDelete(goal._id!)}
            className={`inline-flex items-center gap-1 text-red-600 hover:underline ${
              disableActions ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <FiTrash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Card({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal._id! });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // 👇 fully hide the ORIGINAL while dragging (keeps layout space)
    visibility: isDragging ? "hidden" : "visible",
    pointerEvents: isDragging ? "none" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <CardInner goal={goal} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function CardOverlay({
  goal,
  onEdit,
  onDelete,
  width,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  width?: number;
}) {
  return (
    <div
      style={{ width, boxShadow: "0 12px 30px rgba(0,0,0,0.15)" }}
      className="pointer-events-none rounded-xl border bg-white p-3 ring-1 ring-black/5"
    >
      <CardInner
        goal={goal}
        onEdit={onEdit}
        onDelete={onDelete}
        disableActions
      />
    </div>
  );
}
