"use client";

import { useState } from "react";
import { Check, X, Edit3, ChevronDown, ChevronRight, Lightbulb, BookOpen, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskStatus = "pending" | "accepted" | "rejected" | "editing";

export interface Task {
  id: string;
  title: string;
  description?: string;
  explanation?: string; // Explicación detallada (Learning Mode)
  status: TaskStatus;
}

interface TaskCardProps {
  task: Task;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit?: (id: string, newTitle: string) => void;
  onRequestExplanation?: (id: string) => void;
  onSaveToVault?: (id: string, explanation: string) => void;
}

/**
 * TaskCard - Tarjeta interactiva con Learning Mode
 * 
 * Features:
 * - ✓ Aceptar / ✗ Rechazar / ✎ Editar
 * - 💡 "¿Por qué?" - Pide explicación a Claude
 * - 📖 Explicación expandible (solo se muestra al aceptar)
 * - 💾 Guardar explicación en La Bóveda
 */
export function TaskCard({ 
  task, 
  onAccept, 
  onReject, 
  onEdit,
  onRequestExplanation,
  onSaveToVault
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [showExplanation, setShowExplanation] = useState(false);

  const statusStyles = {
    pending: "border-zinc-700 bg-zinc-800/50",
    accepted: "border-green-500/50 bg-green-500/10",
    rejected: "border-red-500/30 bg-red-500/5 opacity-60",
    editing: "border-purple-500/50 bg-purple-500/10",
  };

  const statusIcon = {
    pending: null,
    accepted: <Check className="h-4 w-4 text-green-400" />,
    rejected: <X className="h-4 w-4 text-red-400" />,
    editing: <Edit3 className="h-4 w-4 text-purple-400" />,
  };

  function handleSaveEdit() {
    if (onEdit && editValue.trim()) {
      onEdit(task.id, editValue.trim());
    }
    setIsEditing(false);
  }

  function handleAccept() {
    onAccept(task.id);
    // Auto-mostrar explicación al aceptar (Learning Mode)
    if (task.explanation) {
      setShowExplanation(true);
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all duration-200",
        statusStyles[task.status]
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        {/* Status Icon */}
        <div className="mt-0.5 w-5 h-5 flex items-center justify-center">
          {statusIcon[task.status] || (
            <div className="w-3 h-3 rounded-full border-2 border-zinc-500" />
          )}
        </div>

        {/* Title */}
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-2 py-1 bg-zinc-900 border border-purple-500 rounded text-sm focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
          ) : (
            <span
              className={cn(
                "text-sm font-medium",
                task.status === "rejected" && "line-through text-zinc-500"
              )}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Expand Button */}
        {(task.description || task.explanation) && !isEditing && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            )}
          </button>
        )}
      </div>

      {/* Description (expandable) */}
      {isExpanded && task.description && (
        <div className="mt-2 ml-7 text-xs text-zinc-400 leading-relaxed">
          {task.description}
        </div>
      )}

      {/* Actions for pending tasks */}
      {task.status === "pending" && !isEditing && (
        <div className="flex flex-wrap gap-2 mt-3 ml-7">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded transition-colors"
          >
            <Check className="h-3 w-3" />
            Aceptar
          </button>
          <button
            onClick={() => onReject(task.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-red-600 rounded transition-colors"
          >
            <X className="h-3 w-3" />
            Rechazar
          </button>
          {onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </button>
          )}
          {onRequestExplanation && !task.explanation && (
            <button
              onClick={() => onRequestExplanation(task.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-600 hover:bg-amber-500 rounded transition-colors"
            >
              <Lightbulb className="h-3 w-3" />
              ¿Por qué?
            </button>
          )}
        </div>
      )}

      {/* Editing Actions */}
      {isEditing && (
        <div className="flex gap-2 mt-3 ml-7">
          <button
            onClick={handleSaveEdit}
            className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditValue(task.title);
            }}
            className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Learning Mode: Explanation Block (shown after accepting) */}
      {task.status === "accepted" && task.explanation && (
        <div className="mt-3 ml-7">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mb-2"
          >
            <BookOpen className="h-3 w-3" />
            {showExplanation ? "Ocultar explicación" : "Ver explicación"}
          </button>
          
          {showExplanation && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-zinc-300 leading-relaxed animate-fade-in">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-purple-400">💡 Explicación</span>
                {onSaveToVault && (
                  <button
                    onClick={() => onSaveToVault(task.id, task.explanation!)}
                    className="flex items-center gap-1 text-zinc-500 hover:text-purple-400 transition-colors"
                    title="Guardar en La Bóveda"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                )}
              </div>
              {task.explanation}
            </div>
          )}
        </div>
      )}

      {/* Undo action */}
      {(task.status === "accepted" || task.status === "rejected") && (
        <div className="mt-2 ml-7">
          <button
            onClick={() => task.status === "accepted" ? onReject(task.id) : onAccept(task.id)}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  );
}
