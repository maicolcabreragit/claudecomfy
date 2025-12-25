"use client";

import { useState } from "react";
import { ChevronRight, HelpCircle, Save, CheckCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  moduleNumber: number;
  lessonNumber: number;
  totalLessons: number;
  moduleName: string;
  lessonTitle: string;
  content: string;
  keyConcept?: string;
  onContinue?: () => void;
  onWhy?: () => void;
  onSave?: () => void;
  isExercise?: boolean;
  onComplete?: () => void;
}

/**
 * LessonCard - Tarjeta de lección estilo academia
 * 
 * Muestra contenido estructurado con botones de acción:
 * - Continuar: Avanzar a siguiente paso
 * - ¿Por qué?: Obtener más detalle
 * - Guardar: Guardar en La Bóveda
 */
export function LessonCard({
  moduleNumber,
  lessonNumber,
  totalLessons,
  moduleName,
  lessonTitle,
  content,
  keyConcept,
  onContinue,
  onWhy,
  onSave,
  isExercise = false,
  onComplete,
}: LessonCardProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    onSave?.();
  };

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isExercise
          ? "border-green-500/40 bg-green-500/5"
          : "border-purple-500/40 bg-purple-500/5"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between text-sm",
          isExercise ? "bg-green-500/10" : "bg-purple-500/10"
        )}
      >
        <div className="flex items-center gap-2">
          <BookOpen className={cn("h-4 w-4", isExercise ? "text-green-400" : "text-purple-400")} />
          <span className={cn("font-medium", isExercise ? "text-green-300" : "text-purple-300")}>
            {isExercise ? "🏋️ Ejercicio" : `📚 Módulo ${moduleNumber}: ${moduleName}`}
          </span>
        </div>
        <span className="text-zinc-500">
          Lección {lessonNumber} de {totalLessons}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-3">{lessonTitle}</h3>
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>

        {/* Key Concept */}
        {keyConcept && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 font-medium">🎯 Concepto clave: </span>
            <span className="text-amber-200">{keyConcept}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Continue/Complete button */}
          {isExercise ? (
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Listo ✓
            </button>
          ) : (
            <button
              onClick={onContinue}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              Continuar
            </button>
          )}

          {/* Why button */}
          {onWhy && (
            <button
              onClick={onWhy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              ¿Por qué?
            </button>
          )}

          {/* Save button */}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saved}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
                saved
                  ? "bg-green-600/20 text-green-400 cursor-default"
                  : "bg-zinc-700 hover:bg-zinc-600"
              )}
            >
              <Save className="h-4 w-4" />
              {saved ? "Guardado ✓" : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Parsea el contenido de un mensaje para detectar formato de lección
 */
export function parseLessonFromContent(content: string): {
  isLesson: boolean;
  moduleNumber?: number;
  lessonNumber?: number;
  totalLessons?: number;
  moduleName?: string;
  lessonTitle?: string;
  lessonContent?: string;
  keyConcept?: string;
  isExercise?: boolean;
  remainingContent: string;
} {
  // Pattern: 📚 **Módulo X: Name** | Lección Y de Z
  const modulePattern = /📚\s*\*\*Módulo\s*(\d+):\s*([^*]+)\*\*\s*\|\s*Lección\s*(\d+)\s*de\s*(\d+)/i;
  const exercisePattern = /🏋️\s*EJERCICIO:\s*([^\n]+)/i;
  const keyConceptPattern = /\*\*🎯\s*Concepto clave:\*\*\s*([^\n]+)/i;
  const titlePattern = /###\s*([^\n]+)/;

  const moduleMatch = content.match(modulePattern);
  const exerciseMatch = content.match(exercisePattern);

  if (!moduleMatch && !exerciseMatch) {
    return { isLesson: false, remainingContent: content };
  }

  const titleMatch = content.match(titlePattern);
  const keyConceptMatch = content.match(keyConceptPattern);

  // Extract content between title and key concept or end
  let lessonContent = content;
  if (titleMatch) {
    const startIdx = content.indexOf(titleMatch[0]) + titleMatch[0].length;
    const endIdx = keyConceptMatch
      ? content.indexOf(keyConceptMatch[0])
      : content.indexOf("---", startIdx);
    lessonContent = content.slice(startIdx, endIdx > startIdx ? endIdx : undefined).trim();
  }

  return {
    isLesson: true,
    moduleNumber: moduleMatch ? parseInt(moduleMatch[1]) : 1,
    lessonNumber: moduleMatch ? parseInt(moduleMatch[3]) : 1,
    totalLessons: moduleMatch ? parseInt(moduleMatch[4]) : 1,
    moduleName: moduleMatch ? moduleMatch[2].trim() : "Ejercicio",
    lessonTitle: titleMatch ? titleMatch[1].trim() : exerciseMatch?.[1]?.trim() || "Lección",
    lessonContent: lessonContent,
    keyConcept: keyConceptMatch ? keyConceptMatch[1].trim() : undefined,
    isExercise: !!exerciseMatch,
    remainingContent: "",
  };
}
