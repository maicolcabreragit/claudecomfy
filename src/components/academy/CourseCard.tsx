"use client";

import { PlayCircle, CheckCircle, Pause, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, Badge, Progress } from "@/components/ui";

interface CourseCardProps {
  id: string;
  title: string;
  topic?: string;
  progress: number;
  currentLesson: number;
  totalLessons: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  onDelete?: (id: string) => void;
  className?: string;
}

/**
 * CourseCard - Individual course progress card
 */
export function CourseCard({
  id,
  title,
  topic,
  progress,
  currentLesson,
  totalLessons,
  status,
  onDelete,
  className,
}: CourseCardProps) {
  const isCompleted = status === "COMPLETED";
  const isPaused = status === "PAUSED";

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isCompleted
          ? "bg-semantic-success/5 border-semantic-success/30"
          : isPaused
          ? "bg-surface-elevated border-border-subtle opacity-70"
          : "bg-surface-elevated border-border-subtle hover:border-accent-purple/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and status */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {isCompleted && (
              <Badge variant="success" size="sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
            {isPaused && (
              <Badge variant="warning" size="sm">
                <Pause className="h-3 w-3 mr-1" />
                Pausado
              </Badge>
            )}
          </div>

          {/* Topic */}
          {topic && (
            <p className="text-sm text-foreground-muted mb-3">{topic}</p>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <Progress
              value={progress}
              variant={isCompleted ? "success" : "default"}
              size="md"
              className="flex-1"
            />
            <span className="text-sm font-medium text-foreground-muted min-w-[40px] text-right">
              {progress}%
            </span>
          </div>

          {/* Lesson count */}
          <p className="text-xs text-foreground-subtle">
            Lección {currentLesson} de {totalLessons}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {!isCompleted && (
            <Link href={`/academy/${id}`}>
              <Button variant="primary" size="sm" leftIcon={PlayCircle}>
                {isPaused ? "Reanudar" : "Continuar"}
              </Button>
            </Link>
          )}
          
          {isCompleted && (
            <Link href={`/academy/${id}`}>
              <Button variant="ghost" size="sm">
                Ver curso
              </Button>
            </Link>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-2 text-foreground-subtle hover:text-semantic-error transition-colors self-end"
              title="Eliminar curso"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
