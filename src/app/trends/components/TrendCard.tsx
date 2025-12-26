"use client";

import { ExternalLink, Radio, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Trend, CATEGORY_CONFIG } from "./types";
import { Badge } from "@/components/ui";
import { usePodcastQueueStore, type QueuedTrend } from "@/store/usePodcastQueueStore";

interface TrendCardProps {
  trend: Trend;
  isExpanded: boolean;
  isFocused?: boolean;
  onToggle: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  usedInEpisode?: number | null; // Episode number if used
}

/**
 * TrendCard - Individual trend item with expandable details
 * 
 * Score colors:
 * - 90+ = Green (hot)
 * - 75+ = Orange (warm)
 * - 50+ = Yellow (moderate)
 * - <50 = Gray (cold)
 */
export function TrendCard({ 
  trend, 
  isExpanded, 
  isFocused = false,
  onToggle,
  onKeyDown,
  usedInEpisode,
}: TrendCardProps) {
  const cat = CATEGORY_CONFIG[trend.category] || {
    label: trend.category,
    emoji: "📌",
    color: "gray",
  };

  // Score-based color classes
  const scoreClasses = getScoreClasses(trend.heatScore);

  // Podcast queue state
  const { addToQueue, removeFromQueue, isInQueue, isUsed } = usePodcastQueueStore();
  const inQueue = isInQueue(trend.id);
  const wasUsed = isUsed(trend.id) || usedInEpisode != null;

  // Handle add/remove from queue
  const handleQueueToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (inQueue) {
      removeFromQueue(trend.id);
    } else {
      const queuedTrend: QueuedTrend = {
        id: trend.id,
        title: trend.title,
        description: trend.description || "",
        category: trend.category,
        heatScore: trend.heatScore,
        addedAt: Date.now(),
      };
      addToQueue(queuedTrend);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
        onKeyDown?.(e);
      }}
      className={cn(
        "bg-surface-base border rounded-lg transition-all duration-fast cursor-pointer",
        "focus:outline-none focus-ring",
        isExpanded
          ? "border-accent-purple ring-1 ring-accent-purple/20"
          : "border-border-subtle hover:border-border-default",
        isFocused && "ring-2 ring-accent-purple/50",
        inQueue && "border-orange-500/50 bg-orange-500/5"
      )}
      onClick={onToggle}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Heat Score Badge */}
        <div
          className={cn(
            "w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-bold",
            scoreClasses.bg,
            scoreClasses.text
          )}
        >
          {trend.heatScore}
        </div>

        <div className="flex-1 min-w-0">
          {/* Category and badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="default" size="sm">
              {cat.emoji} {cat.label}
            </Badge>
            <span className="text-xs text-foreground-subtle">{trend.source}</span>
            
            {/* Hot badge */}
            {trend.heatScore >= 90 && (
              <Badge variant="success" size="sm">🔥 Hot</Badge>
            )}
            
            {/* Podcast badges */}
            {inQueue && (
              <Badge variant="warning" size="sm">
                <Radio className="h-3 w-3 mr-1" />
                En cola
              </Badge>
            )}
            {wasUsed && usedInEpisode && (
              <Badge variant="default" size="sm">
                📻 EP{usedInEpisode}
              </Badge>
            )}
            {wasUsed && !usedInEpisode && !inQueue && (
              <Badge variant="default" size="sm">
                ✓ Usado
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-foreground line-clamp-1">{trend.title}</h3>

          {/* Preview description (when not expanded) */}
          {!isExpanded && trend.description && (
            <p className="text-sm text-foreground-muted line-clamp-1 mt-0.5">
              {trend.description}
            </p>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <p className="text-sm text-foreground-muted">{trend.description}</p>
              
              {/* Keywords */}
              {trend.keywords && trend.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {trend.keywords.slice(0, 5).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs px-2 py-0.5 bg-surface-overlay rounded-full text-foreground-subtle"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {/* Podcast button */}
                <button
                  onClick={handleQueueToggle}
                  disabled={wasUsed && !inQueue}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    inQueue
                      ? "bg-orange-500 text-white"
                      : wasUsed
                        ? "bg-surface-overlay text-foreground-subtle cursor-not-allowed"
                        : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                  )}
                >
                  {inQueue ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      En cola
                    </>
                  ) : wasUsed ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Usado
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Añadir a Podcast
                    </>
                  )}
                </button>

                {/* Link */}
                {trend.url && (
                  <a
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                      "bg-surface-overlay text-foreground-subtle hover:text-foreground",
                      "transition-colors"
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Fuente
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreClasses(score: number): { bg: string; text: string } {
  if (score >= 90) {
    return { bg: "bg-semantic-success/20", text: "text-semantic-success" };
  }
  if (score >= 75) {
    return { bg: "bg-orange-500/20", text: "text-orange-400" };
  }
  if (score >= 50) {
    return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
  }
  return { bg: "bg-surface-overlay", text: "text-foreground-subtle" };
}
