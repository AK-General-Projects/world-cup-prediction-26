"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { saveGroupPredictions } from "@/server/actions/predictions";

type Team = { id: number; name: string; flagCode: string };
type GroupedTeams = Record<string, Team[]>;
type SaveStatus = "idle" | "saving" | "saved";

export default function GroupBoard({ initialGroups, isLocked }: { initialGroups: GroupedTeams; isLocked: boolean }) {
  const [groups, setGroups] = useState<GroupedTeams>(initialGroups);
  const [status, setStatus] = useState<Record<string, SaveStatus>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId !== destination.droppableId) return;
    if (source.index === destination.index) return;

    if (isLocked) return;
    const key = source.droppableId;
    const prev = groups[key];
    const updated = [...prev];
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);

    setGroups((g) => ({ ...g, [key]: updated }));
    setStatus((s) => ({ ...s, [key]: "saving" }));

    try {
      await saveGroupPredictions(key, updated.map((t) => t.id));
      setStatus((s) => ({ ...s, [key]: "saved" }));
      setTimeout(() => setStatus((s) => ({ ...s, [key]: "idle" })), 2000);
    } catch {
      setGroups((g) => ({ ...g, [key]: prev }));
      setStatus((s) => ({ ...s, [key]: "idle" }));
      setSaveError("Failed to save — please check your connection and try again.");
      setTimeout(() => setSaveError(null), 5000);
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {saveError && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(groups)
          .sort()
          .map((letter) => (
            <div key={letter} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 text-sm">Group {letter}</h2>
                {status[letter] === "saving" && (
                  <span className="text-xs text-gray-400">Saving...</span>
                )}
                {status[letter] === "saved" && (
                  <span className="text-xs text-green-500">Saved ✓</span>
                )}
              </div>

              <Droppable droppableId={letter}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`divide-y divide-gray-100 transition-colors ${
                      snapshot.isDraggingOver ? "bg-green-50" : ""
                    }`}
                  >
                    {groups[letter].map((team, index) => (
                      <Draggable
                        key={team.id}
                        draggableId={String(team.id)}
                        index={index}
                        isDragDisabled={isLocked}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 px-4 py-2.5 select-none transition-shadow ${
                              snapshot.isDragging
                                ? "bg-white shadow-lg rounded-lg"
                                : "bg-white"
                            }`}
                          >
                            <span className="w-4 text-center text-xs font-bold text-gray-400">
                              {index + 1}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://flagcdn.com/24x18/${team.flagCode}.png`}
                              width={24}
                              height={18}
                              alt={team.name}
                              className="rounded-sm flex-shrink-0"
                            />
                            <span className="text-sm text-gray-800 flex-1">{team.name}</span>
                            <span className="text-gray-300 text-sm">⠿</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
      </div>
    </DragDropContext>
  );
}
