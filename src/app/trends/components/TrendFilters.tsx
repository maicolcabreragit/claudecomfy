"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_CONFIG } from "./types";

interface TrendFiltersProps {
  dates: string[];
  trendsByDate: Record<string, { length: number }[]>;
  selectedDate: string | null;
  selectedCategory: string | null;
  totalTrends: number;
  categoryStats: Record<string, number>;
  onDateChange: (date: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

/**
 * TrendFilters - Sidebar with date and category filters
 */
export function TrendFilters({
  dates,
  trendsByDate,
  selectedDate,
  selectedCategory,
  totalTrends,
  categoryStats,
  onDateChange,
  onCategoryChange,
}: TrendFiltersProps) {
  return (
    <div className="w-48 flex-shrink-0">
      <div className="sticky top-20 space-y-2">
        {/* Date Filters */}
        <h3 className="text-xs uppercase text-zinc-500 mb-2">📅 Por Fecha</h3>
        <button
          onClick={() => onDateChange(null)}
          className={cn(
            "w-full text-left px-3 py-2 rounded text-sm transition-colors",
            !selectedDate
              ? "bg-accent-purple text-white"
              : "bg-surface-elevated hover:bg-surface-overlay"
          )}
        >
          Todas ({totalTrends})
        </button>
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm transition-colors",
              selectedDate === date
                ? "bg-accent-purple text-white"
                : "bg-surface-elevated hover:bg-surface-overlay"
            )}
          >
            📅 {date} ({(trendsByDate[date] as unknown[])?.length || 0})
          </button>
        ))}

        <hr className="border-surface-border my-4" />

        {/* Category Filters */}
        <h3 className="text-xs uppercase text-zinc-500 mb-2">🏷️ Categorías</h3>
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "w-full text-left px-3 py-2 rounded text-sm transition-colors",
            !selectedCategory
              ? "bg-accent-purple text-white"
              : "bg-surface-elevated hover:bg-surface-overlay"
          )}
        >
          Todas
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={cn(
              "w-full text-left px-3 py-2 rounded text-sm transition-colors",
              selectedCategory === key
                ? "bg-accent-purple text-white"
                : "bg-surface-elevated hover:bg-surface-overlay"
            )}
          >
            {emoji} {label} ({categoryStats[key] || 0})
          </button>
        ))}
      </div>
    </div>
  );
}
