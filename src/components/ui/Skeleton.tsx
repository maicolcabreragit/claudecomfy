"use client";

import { cn } from "@/lib/utils";

/* ============================================================================
   Skeleton - Loading placeholder with pulse animation
   ============================================================================ */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-overlay",
        className
      )}
      {...props}
    />
  );
}

/* ============================================================================
   SkeletonText - Text line placeholder
   ============================================================================ */

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/* ============================================================================
   SkeletonCard - Card placeholder
   ============================================================================ */

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("card-base p-4 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

/* ============================================================================
   SkeletonMessage - Chat message placeholder
   ============================================================================ */

interface SkeletonMessageProps {
  isUser?: boolean;
  className?: string;
}

export function SkeletonMessage({ isUser = false, className }: SkeletonMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "",
        className
      )}
    >
      {/* Avatar */}
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      
      {/* Content */}
      <div className={cn(
        "flex-1 max-w-[70%] space-y-2",
        isUser ? "items-end" : ""
      )}>
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   SkeletonList - List of skeleton items
   ============================================================================ */

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 5, className }: SkeletonListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
