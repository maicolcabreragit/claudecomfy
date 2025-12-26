"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeCardProps {
  minutes: number;
  className?: string;
}

/**
 * TimeCard - Shows time spent learning today
 */
export function TimeCard({ minutes, className }: TimeCardProps) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const formattedTime =
    hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const isProductivity = minutes >= 60;
  const isDeepWork = minutes >= 120;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isDeepWork
          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30"
          : isProductivity
          ? "bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20"
          : "bg-surface-elevated border-border-subtle",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            isDeepWork
              ? "bg-purple-500/30"
              : isProductivity
              ? "bg-purple-500/20"
              : "bg-surface-overlay"
          )}
        >
          <Clock
            className={cn(
              "h-6 w-6",
              isDeepWork || isProductivity
                ? "text-purple-400"
                : "text-foreground-muted"
            )}
          />
        </div>

        <div>
          <p className="text-xs text-foreground-subtle uppercase tracking-wide">
            Tiempo hoy
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-2xl font-bold",
                isDeepWork || isProductivity ? "text-purple-400" : "text-foreground"
              )}
            >
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Status message */}
      <p className="mt-2 text-xs text-foreground-muted">
        {isDeepWork
          ? "🧠 ¡Deep work mode!"
          : isProductivity
          ? "⚡ ¡Productivo!"
          : minutes > 0
          ? "📚 Sigue aprendiendo"
          : "🎯 Empieza tu sesión"}
      </p>
    </div>
  );
}
