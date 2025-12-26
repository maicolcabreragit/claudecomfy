"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState - Placeholder for empty content areas
 * 
 * Use when lists, tables, or content areas have no data to display
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-foreground-subtle">
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn(
                  "h-12 w-12",
                  (icon as React.ReactElement<{ className?: string }>).props.className
                ),
              })
            : icon
          }
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-foreground-muted max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
