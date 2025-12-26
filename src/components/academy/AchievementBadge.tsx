"use client";

import { LucideIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  unlocked: boolean;
  unlockedAt?: string;
  className?: string;
}

/**
 * AchievementBadge - Individual achievement with locked/unlocked state
 */
export function AchievementBadge({
  title,
  description,
  icon: Icon,
  unlocked,
  unlockedAt,
  className,
}: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        "relative group p-3 rounded-xl border transition-all",
        unlocked
          ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30"
          : "bg-surface-elevated border-border-subtle opacity-60",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            unlocked ? "bg-amber-500/20" : "bg-surface-overlay"
          )}
        >
          {unlocked ? (
            <Icon className="h-5 w-5 text-amber-400" />
          ) : (
            <Lock className="h-5 w-5 text-foreground-subtle" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "text-sm font-medium truncate",
              unlocked ? "text-amber-300" : "text-foreground-muted"
            )}
          >
            {title}
          </h4>
          {description && (
            <p className="text-xs text-foreground-subtle truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Tooltip on hover */}
      {unlockedAt && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-overlay rounded text-xs text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Desbloqueado el {new Date(unlockedAt).toLocaleDateString("es-ES")}
        </div>
      )}
    </div>
  );
}

interface AchievementsListProps {
  achievements: Array<{
    id: string;
    title: string;
    description?: string;
    icon: LucideIcon;
    unlocked: boolean;
    unlockedAt?: string;
  }>;
  className?: string;
}

/**
 * AchievementsList - Grid of achievement badges
 */
export function AchievementsList({ achievements, className }: AchievementsListProps) {
  const unlockedFirst = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
      {unlockedFirst.map((achievement) => (
        <AchievementBadge key={achievement.id} {...achievement} />
      ))}
    </div>
  );
}
