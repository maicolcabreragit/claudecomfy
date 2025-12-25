"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Phase = "planning" | "review" | "development" | "complete";

interface ProgressBarProps {
  currentPhase: Phase;
  className?: string;
}

const PHASES: { id: Phase; label: string }[] = [
  { id: "planning", label: "Planificación" },
  { id: "review", label: "Revisión" },
  { id: "development", label: "Desarrollo" },
  { id: "complete", label: "Completo" },
];

/**
 * ProgressBar - Barra de progreso del desarrollo
 * 
 * Muestra las fases:
 * [ Planificación ] → [ Revisión ] → [ Desarrollo ] → [ ✓ Completo ]
 */
export function ProgressBar({ currentPhase, className }: ProgressBarProps) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className={cn("flex items-center justify-center gap-1 py-3", className)}>
      {PHASES.map((phase, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === PHASES.length - 1;

        return (
          <div key={phase.id} className="flex items-center">
            {/* Phase Node */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-purple-500 text-white ring-2 ring-purple-500/30 ring-offset-2 ring-offset-zinc-900",
                  !isCompleted && !isCurrent && "bg-zinc-800 text-zinc-500 border border-zinc-700"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Label */}
              <span
                className={cn(
                  "mt-1 text-xs whitespace-nowrap",
                  isCurrent && "text-purple-300 font-medium",
                  isCompleted && "text-green-400",
                  !isCompleted && !isCurrent && "text-zinc-600"
                )}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2 mb-5",
                  index < currentIndex ? "bg-green-500" : "bg-zinc-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
