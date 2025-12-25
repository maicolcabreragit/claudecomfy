"use client";

import { useMemo } from "react";
import { TaskCard, Task, TaskStatus } from "./TaskCard";
import { Rocket, CheckCircle2, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartDevelopment?: () => void;
}

/**
 * TaskList - Contenedor de tarjetas de tareas
 * 
 * Agrupa TaskCards con:
 * - Contador de progreso
 * - Botón "Aceptar Todas"
 * - Botón "🚀 Comenzar Desarrollo"
 */
export function TaskList({
  tasks,
  onTasksChange,
  onStartDevelopment,
}: TaskListProps) {
  const stats = useMemo(() => {
    const accepted = tasks.filter((t) => t.status === "accepted").length;
    const rejected = tasks.filter((t) => t.status === "rejected").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    return { accepted, rejected, pending, total: tasks.length };
  }, [tasks]);

  const allDecided = stats.pending === 0;
  const hasAccepted = stats.accepted > 0;

  function updateTaskStatus(id: string, status: TaskStatus) {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }

  function handleAccept(id: string) {
    updateTaskStatus(id, "accepted");
  }

  function handleReject(id: string) {
    updateTaskStatus(id, "rejected");
  }

  function handleEdit(id: string, newTitle: string) {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  }

  function acceptAll() {
    onTasksChange(
      tasks.map((t) => (t.status === "pending" ? { ...t, status: "accepted" } : t))
    );
  }

  function resetAll() {
    onTasksChange(tasks.map((t) => ({ ...t, status: "pending" })));
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden glass animate-scale-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Tareas Propuestas</span>
          </div>
          
          {/* Progress Counter */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">
              {stats.accepted} aceptadas
            </span>
            {stats.rejected > 0 && (
              <span className="text-red-400">
                {stats.rejected} rechazadas
              </span>
            )}
            {stats.pending > 0 && (
              <span className="text-zinc-500">
                {stats.pending} pendientes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="p-4 space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onAccept={handleAccept}
            onReject={handleReject}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800/30">
        <div className="flex items-center justify-between gap-2">
          {/* Left Actions */}
          <div className="flex gap-2">
            {stats.pending > 0 && (
              <button
                onClick={acceptAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
              >
                <CheckCircle2 className="h-3 w-3" />
                Aceptar Todas
              </button>
            )}
            {allDecided && (
              <button
                onClick={resetAll}
                className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                Reiniciar
              </button>
            )}
          </div>

          {/* Start Development Button */}
          {allDecided && hasAccepted && onStartDevelopment && (
            <button
              onClick={onStartDevelopment}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "transition-all duration-200 shadow-lg shadow-purple-500/20"
              )}
            >
              <Rocket className="h-4 w-4" />
              Comenzar Desarrollo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
