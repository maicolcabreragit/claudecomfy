"use client";

import { X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui";

interface ActiveCourse {
  id: string;
  title: string;
  progress: number; // 0-100
  currentLesson: number;
  totalLessons: number;
}

interface AcademyModeBarProps {
  course: ActiveCourse;
  onExit: () => void;
  className?: string;
}

/**
 * AcademyModeBar - Top bar replacement when in Academy/Course mode
 * 
 * Shows: Course name, progress bar, current lesson, exit button
 */
export function AcademyModeBar({ course, onExit, className }: AcademyModeBarProps) {
  return (
    <header
      className={cn(
        "h-12 flex items-center justify-between px-4 border-b border-border-subtle",
        "bg-gradient-to-r from-surface-base via-surface-base to-accent-purple/5",
        className
      )}
    >
      {/* Left: Course info */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-accent-purple/20 rounded-lg">
          <BookOpen className="h-4 w-4 text-accent-purple" />
        </div>
        <div>
          <span className="text-sm font-medium text-foreground">
            {course.title}
          </span>
          <span className="text-xs text-foreground-subtle ml-2">
            Lección {course.currentLesson} de {course.totalLessons}
          </span>
        </div>
      </div>

      {/* Center: Progress bar */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-8">
        <Progress value={course.progress} size="md" className="flex-1" />
        <span className="text-sm font-semibold text-accent-purple min-w-[3ch]">
          {course.progress}%
        </span>
      </div>

      {/* Right: Exit button */}
      <button
        onClick={onExit}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          "text-sm text-foreground-muted hover:text-foreground",
          "hover:bg-surface-elevated transition-colors",
          "focus-ring"
        )}
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Salir del curso</span>
      </button>
    </header>
  );
}
