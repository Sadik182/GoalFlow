"use client";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { FiEdit2, FiTrash2, FiCalendar } from "react-icons/fi";
import type { Goal } from "@/types/goal";

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 0.25s ease",
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative select-none rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <header>
        <h4 className="font-semibold text-gray-800">{goal.title}</h4>
        {goal.description && (
          <p className="mt-1 text-sm text-gray-600">{goal.description}</p>
        )}
      </header>

      <footer className="mt-3 flex items-center justify-between text-xs text-gray-500">
        {goal.dueDate && (
          <span className="flex items-center gap-1">
            <FiCalendar className="h-4 w-4" />
            {new Date(goal.dueDate).toLocaleDateString()}
          </span>
        )}
        <div className="flex gap-2">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(goal)}
            className="rounded-md p-1 hover:bg-gray-100"
            aria-label="Edit"
          >
            <FiEdit2 className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(goal._id!)}
            className="rounded-md p-1 hover:bg-red-50"
            aria-label="Delete"
          >
            <FiTrash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </footer>
    </article>
  );
}
