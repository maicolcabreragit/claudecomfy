"use client";

import { cn } from "@/lib/utils";
import { Trophy, BookOpen, Target } from "lucide-react";

interface CourseProgressProps {
  currentModule: number;
  totalModules: number;
  currentLesson: number;
  totalLessons: number;
  courseName?: string;
  className?: string;
}

/**
 * CourseProgress - Barra de progreso del curso estilo academia
 */
export function CourseProgress({
  currentModule,
  totalModules,
  currentLesson,
  totalLessons,
  courseName,
  className,
}: CourseProgressProps) {
  // Calculate overall progress
  const totalLessonsOverall = totalModules * totalLessons;
  const completedLessons = (currentModule - 1) * totalLessons + currentLesson - 1;
  const progressPercent = Math.round((completedLessons / totalLessonsOverall) * 100);

  return (
    <div className={cn("px-4 py-3 bg-zinc-900/50 border-b border-zinc-800", className)}>
      <div className="max-w-3xl mx-auto">
        {/* Course name and progress */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">
              {courseName || "Curso en progreso"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Target className="h-3 w-3" />
            <span>{progressPercent}% completado</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Module/Lesson info */}
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span>
            Módulo {currentModule} de {totalModules}
          </span>
          <span>
            Lección {currentLesson} de {totalLessons}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * AchievementBadge - Badge de logro al completar módulos
 */
export function AchievementBadge({
  moduleName,
  onDismiss,
}: {
  moduleName: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
      <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-8 text-center animate-scale-in max-w-sm mx-4">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">🎉 ¡Módulo Completado!</h3>
        <p className="text-zinc-400 mb-4">{moduleName}</p>
        <button
          onClick={onDismiss}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}
