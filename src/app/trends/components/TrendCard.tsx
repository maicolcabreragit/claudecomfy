"use client";

import { cn } from "@/lib/utils";
import { type Trend, CATEGORY_CONFIG } from "./types";

interface TrendCardProps {
  trend: Trend;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * TrendCard - Individual trend item with expandable details
 */
export function TrendCard({ trend, isExpanded, onToggle }: TrendCardProps) {
  const cat = CATEGORY_CONFIG[trend.category] || {
    label: trend.category,
    emoji: "📌",
    color: "gray",
  };

  return (
    <div
      className={cn(
        "bg-surface-base border rounded-lg transition-colors cursor-pointer",
        isExpanded
          ? "border-accent-purple"
          : "border-surface-border hover:border-zinc-600"
      )}
      onClick={onToggle}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Heat Score */}
        <div
          className={cn(
            "w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-bold",
            trend.heatScore >= 75
              ? "bg-orange-500/20 text-orange-400"
              : trend.heatScore >= 50
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-surface-elevated text-zinc-400"
          )}
        >
          {trend.heatScore}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-1.5 py-0.5 bg-surface-elevated rounded">
              {cat.emoji} {cat.label}
            </span>
            <span className="text-xs text-zinc-500">{trend.source}</span>
          </div>
          <h3 className="font-medium text-foreground truncate">{trend.title}</h3>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-zinc-400">{trend.description}</p>
              {trend.url && (
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block text-sm text-accent-purple hover:text-accent-purple/80"
                >
                  🔗 Ver fuente →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
