"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  days: number;
  className?: string;
}

/**
 * StreakCard - Shows consecutive days of activity
 */
export function StreakCard({ days, className }: StreakCardProps) {
  const isHot = days >= 7;
  const isBurning = days >= 30;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isBurning
          ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30"
          : isHot
          ? "bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/20"
          : "bg-surface-elevated border-border-subtle",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            isBurning
              ? "bg-orange-500/30"
              : isHot
              ? "bg-orange-500/20"
              : "bg-surface-overlay"
          )}
        >
          <Flame
            className={cn(
              "h-6 w-6",
              isBurning
                ? "text-orange-400 animate-pulse"
                : isHot
                ? "text-orange-400"
                : "text-foreground-muted"
            )}
          />
        </div>

        <div>
          <p className="text-xs text-foreground-subtle uppercase tracking-wide">
            Racha
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-2xl font-bold",
                isBurning || isHot ? "text-orange-400" : "text-foreground"
              )}
            >
              {days}
            </span>
            <span className="text-sm text-foreground-muted">días</span>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      {days > 0 && (
        <p className="mt-2 text-xs text-foreground-muted">
          {isBurning
            ? "🔥 ¡Imparable! Sigue así."
            : isHot
            ? "🌟 ¡Gran racha! No pares."
            : days >= 3
            ? "💪 ¡Vas muy bien!"
            : "🚀 ¡Sigue aprendiendo!"}
        </p>
      )}
    </div>
  );
}
