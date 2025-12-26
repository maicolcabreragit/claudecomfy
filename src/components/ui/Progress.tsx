"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-500 to-pink-500",
        success: "bg-semantic-success",
        warning: "bg-semantic-warning",
        info: "bg-semantic-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, variant, showLabel = false, size = "md", ...props }, ref) => {
    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    return (
      <div className={cn("flex items-center gap-3", className)} ref={ref} {...props}>
        {/* Track */}
        <div
          className={cn(
            "flex-1 rounded-full bg-surface-overlay overflow-hidden",
            sizeClasses[size]
          )}
        >
          {/* Bar */}
          <div
            className={cn(progressVariants({ variant }))}
            style={{ width: `${clampedValue}%` }}
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Label */}
        {showLabel && (
          <span className="text-xs font-medium text-foreground-muted min-w-[3ch] text-right">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress, progressVariants };
