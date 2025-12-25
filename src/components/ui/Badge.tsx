"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base styles
  "inline-flex items-center font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-surface-elevated border border-surface-border text-zinc-300",
        primary:
          "bg-accent-purple/20 text-accent-purple border border-accent-purple/30",
        success:
          "bg-semantic-success/10 text-semantic-success border border-semantic-success/30",
        warning:
          "bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/30",
        destructive:
          "bg-semantic-error/10 text-semantic-error border border-semantic-error/30",
        outline:
          "border border-surface-border text-zinc-400 bg-transparent",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5 rounded",
        md: "text-xs px-2 py-0.5 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
