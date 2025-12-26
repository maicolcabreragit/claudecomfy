"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  MessageSquare,
  Trash2,
  Sparkles,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// ============================================================================
// Types
// ============================================================================

interface LearningUnit {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface LearningModule {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  progress: number;
  conversationId: string | null;
  isManual: boolean;
  units: LearningUnit[];
  createdAt: string;
  updatedAt: string;
}

interface ModuleCardProps {
  module: LearningModule;
  onModuleUpdate: () => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ModuleCard({ module, onModuleUpdate, onDelete }: ModuleCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const completedUnits = module.units.filter((u) => u.completed).length;
  const totalUnits = module.units.length;

  // Toggle unit completion
  async function handleToggleUnit(unitId: string, completed: boolean) {
    setIsUpdating(true);
    try {
      await fetch(`/api/learning/modules/${module.id}/units`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, completed }),
      });
      onModuleUpdate();
    } catch (err) {
      console.error("Failed to toggle unit:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  // Navigate to chat
  function handleContinueInChat() {
    if (module.conversationId) {
      router.push(`/?conversation=${module.conversationId}`);
    } else {
      router.push("/");
    }
  }

  // Delete module
  async function handleDelete() {
    if (!confirm(`¿Eliminar "${module.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/learning/modules/${module.id}`, {
        method: "DELETE",
      });
      onDelete(module.id);
    } catch (err) {
      console.error("Failed to delete module:", err);
      setIsDeleting(false);
    }
  }

  return (
    <Card
      className={cn(
        "transition-all",
        module.status === "COMPLETED" && "opacity-75",
        module.status === "PAUSED" && "border-yellow-500/30"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium line-clamp-1">{module.title}</h3>
              {module.isManual ? (
                <Badge variant="default" size="sm">
                  <Pencil className="h-3 w-3 mr-1" />
                  Manual
                </Badge>
              ) : (
                <Badge variant="primary" size="sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 line-clamp-1">{module.topic}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-zinc-500 hover:text-semantic-error"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        {module.description && (
          <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
            {module.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Progreso</span>
            <span>{module.progress}%</span>
          </div>
          <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                module.progress === 100
                  ? "bg-semantic-success"
                  : "bg-gradient-to-r from-purple-500 to-pink-500"
              )}
              style={{ width: `${module.progress}%` }}
            />
          </div>
        </div>

        {/* Units section */}
        {totalUnits > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors w-full"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>
                {completedUnits}/{totalUnits} unidades completadas
              </span>
            </button>

            {expanded && (
              <ul className="mt-2 space-y-1.5 pl-4 border-l border-surface-border">
                {module.units.map((unit) => (
                  <li key={unit.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleUnit(unit.id, !unit.completed)}
                      disabled={isUpdating}
                      className="flex-shrink-0 transition-colors"
                    >
                      {unit.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-semantic-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-500 hover:text-purple-400" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-xs",
                        unit.completed
                          ? "text-zinc-500 line-through"
                          : "text-zinc-300"
                      )}
                    >
                      {unit.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Status badge */}
        {module.status !== "ACTIVE" && (
          <div className="mb-3">
            <Badge
              variant={module.status === "COMPLETED" ? "success" : "warning"}
              size="sm"
            >
              {module.status === "COMPLETED" ? "✓ Completado" : "⏸ Pausado"}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <span className="text-[10px] text-zinc-600">
            {new Date(module.updatedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={MessageSquare}
            onClick={handleContinueInChat}
          >
            Continuar en Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
