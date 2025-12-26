"use client";

import { useState } from "react";
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface LessonStep {
  id: string;
  title: string;
  completed: boolean;
}

interface Lesson {
  id: string;
  number: number;
  title: string;
  description?: string;
  steps: LessonStep[];
  resourceUrl?: string;
}

interface LessonPanelProps {
  lesson: Lesson;
  totalLessons: number;
  onStepComplete: (stepId: string, completed: boolean) => void;
  onLessonComplete: () => void;
  onNextLesson: () => void;
  className?: string;
}

/**
 * LessonPanel - Right sidebar showing current lesson details and progress
 */
export function LessonPanel({
  lesson,
  totalLessons,
  onStepComplete,
  onLessonComplete,
  onNextLesson,
  className,
}: LessonPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedSteps = lesson.steps.filter(s => s.completed).length;
  const allComplete = completedSteps === lesson.steps.length;
  const progress = lesson.steps.length > 0 
    ? Math.round((completedSteps / lesson.steps.length) * 100) 
    : 0;

  return (
    <aside
      className={cn(
        "w-72 bg-surface-base border-l border-border-subtle flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent-purple" />
            <span className="text-xs font-medium text-foreground-subtle uppercase tracking-wide">
              Lección {lesson.number}/{totalLessons}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-foreground-subtle hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <h3 className="text-sm font-semibold text-foreground line-clamp-2">
          {lesson.title}
        </h3>
        
        {lesson.description && (
          <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
            {lesson.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-purple rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-foreground-subtle">
            {completedSteps}/{lesson.steps.length}
          </span>
        </div>
      </div>

      {/* Steps list */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {lesson.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onStepComplete(step.id, !step.completed)}
                className={cn(
                  "w-full flex items-start gap-3 p-2 rounded-lg text-left",
                  "transition-colors duration-fast",
                  step.completed
                    ? "bg-semantic-success/10 hover:bg-semantic-success/15"
                    : "hover:bg-surface-elevated"
                )}
              >
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-semantic-success shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-foreground-subtle shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm block",
                    step.completed
                      ? "text-foreground-muted line-through"
                      : "text-foreground"
                  )}>
                    {index + 1}. {step.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="p-4 border-t border-border-subtle space-y-2">
        {allComplete ? (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={PlayCircle}
            onClick={onNextLesson}
          >
            Siguiente lección
          </Button>
        ) : (
          <Button
            variant="default"
            size="md"
            className="w-full"
            onClick={onLessonComplete}
            disabled={!allComplete}
          >
            Marcar como completada
          </Button>
        )}

        {lesson.resourceUrl && (
          <a
            href={lesson.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2",
              "text-xs text-foreground-muted hover:text-foreground transition-colors"
            )}
          >
            <ExternalLink className="h-3 w-3" />
            Ver recursos adicionales
          </a>
        )}
      </div>
    </aside>
  );
}
