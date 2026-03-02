import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useUpdateTask } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, User, AlignLeft } from "lucide-react";
import { format } from "date-fns";

const COLUMNS = [
  { id: "todo", title: "BACKLOG", color: "bg-muted" },
  { id: "in_progress", title: "IN_PROGRESS", color: "bg-secondary" },
  { id: "done", title: "SHIPPED", color: "bg-primary" },
];

export function KanbanBoard({
  tasks,
  projectId,
  user,
  isLead,
}: {
  tasks: any[];
  projectId: number;
  user: any;
  isLead: boolean;
}) {
  const updateTask = useUpdateTask();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Permission Check: only assigned user OR lead can move
    const isAssigned = task.assignedUserId === user?.id;
    if (!isLead && !isAssigned) return;

    if (task.status !== newStatus) {
      updateTask.mutate({
        id: taskId,
        projectId,
        updates: { status: newStatus },
      });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            colorClass={col.color}
            tasks={tasks.filter((t) => t.status === col.id)}
            user={user}
            isLead={isLead}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  title,
  colorClass,
  tasks,
  user,
  isLead,
}: {
  id: string;
  title: string;
  colorClass: string;
  tasks: any[];
  user: any;
  isLead: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full bg-card/20 rounded-xl border border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${colorClass}`} />
          <h3 className="font-display font-bold tracking-wider">{title}</h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {tasks.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-4 min-h-[500px] transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} user={user} isLead={isLead} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ task, user, isLead }: { task: any; user: any; isLead: boolean }) {
  const isAssigned = task.assignedUserId === user?.id;
  const canMove = isLead || isAssigned;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled: !canMove,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        pointerEvents: "none" as const,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(canMove ? listeners : {})}
      {...(canMove ? attributes : {})}
      className={`p-4 transition-all duration-200 ${canMove ? "cursor-grab active:cursor-grabbing hover-elevate" : "cursor-not-allowed opacity-80"} border-border/60 ${isDragging ? "opacity-50 ring-2 ring-primary shadow-2xl scale-105" : "glass-panel"} relative group overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-sans font-semibold line-clamp-2 ${!canMove ? "text-muted-foreground" : ""}`}>
          {task.title}
        </h4>
        {isAssigned && (
          <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1 bg-primary/10 text-primary border-primary/20">
            MINE
          </Badge>
        )}
        {!canMove && (
          <div className="text-muted-foreground/30 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        )}
      </div>

      {task.description && (
        <div className="flex items-start text-xs text-muted-foreground mb-4 font-sans line-clamp-2">
          <AlignLeft className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          {task.description}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
        <div className="flex items-center text-xs text-muted-foreground font-mono">
          <Calendar className="w-3 h-3 mr-1" />
          {format(new Date(task.deadline), "MMM d, HH:mm")}
        </div>
        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30"
            title={task.assignee.username}
          >
            <span className="text-[10px] font-mono text-primary font-bold">
              {task.assignee.username.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
