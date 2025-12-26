"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
  description?: string;
  className?: string;
}

/**
 * SectionHeader - Title for content sections with optional count and action
 */
export function SectionHeader({
  title,
  count,
  action,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between gap-4">
        {/* Title with optional count */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {count !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-surface-overlay text-foreground-muted">
              {count}
            </span>
          )}
        </div>

        {/* Action */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-foreground-muted mt-1">
          {description}
        </p>
      )}

      {/* Decorative line */}
      <div className="mt-3 h-px bg-gradient-to-r from-border-subtle via-border-default to-transparent" />
    </div>
  );
}

/* ============================================================================
   SectionDivider - Simple divider between sections
   ============================================================================ */

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("my-6 h-px bg-border-subtle", className)} />
  );
}
