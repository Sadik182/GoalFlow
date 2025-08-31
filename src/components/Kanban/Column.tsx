"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Goal, Status } from "@/types/goal";
import Card from "./Card";

export default function Column({
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
    data: { type: "container", status: id }, // ✅ important for cross-column drop
  });

  return (
    <section className="flex-1 min-w-[300px] min-h-0">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-gray-700">{title}</h3>
        <span className="text-sm text-gray-400 font-bold">{items.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`select-none rounded-2xl border p-3 transition-colors
         overflow-y-auto h-[70vh] overscroll-contain pr-2
        ${isOver ? "border-sky-400 bg-sky-50" : "border-gray-200 bg-gray-50"}`}
      >
        <SortableContext
          items={items.map((i) => i._id!)}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 ? (
            <div className="grid place-content-center py-10 text-sm text-gray-400">
              Drop a goal here
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((g) => (
                <Card
                  key={g._id}
                  goal={g}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  );
}
