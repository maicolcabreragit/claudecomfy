"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
   DataList - Vertical list container with keyboard navigation
   ============================================================================ */

interface DataListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DataList({ children, className, ...props }: DataListProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const items = listRef.current?.querySelectorAll('[data-list-item="true"]');
    if (!items?.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (focusedIndex >= 0) {
          (items[focusedIndex] as HTMLElement).click();
        }
        break;
      case "Escape":
        setFocusedIndex(-1);
        break;
    }
  }, [focusedIndex]);

  React.useEffect(() => {
    if (focusedIndex >= 0) {
      const items = listRef.current?.querySelectorAll('[data-list-item="true"]');
      if (items?.[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).focus();
      }
    }
  }, [focusedIndex]);

  return (
    <div
      ref={listRef}
      role="list"
      className={cn("space-y-1", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

/* ============================================================================
   DataListItem - Individual list item
   ============================================================================ */

interface DataListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  disabled?: boolean;
}

export const DataListItem = React.forwardRef<HTMLDivElement, DataListItemProps>(
  ({ 
    icon, 
    title, 
    description, 
    badge, 
    action, 
    disabled = false,
    className, 
    onClick,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        role="listitem"
        data-list-item="true"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onClick}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg",
          "transition-all duration-fast",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-surface-elevated focus:bg-surface-elevated focus-ring",
          className
        )}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 text-foreground-subtle group-hover:text-foreground-muted transition-colors">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {title}
            </span>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-foreground-subtle truncate mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Action */}
        {action && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {action}
          </div>
        )}
      </div>
    );
  }
);

DataListItem.displayName = "DataListItem";

/* ============================================================================
   DataListSeparator - Visual separator between groups
   ============================================================================ */

export function DataListSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("my-2 border-t border-border-subtle", className)} />
  );
}

/* ============================================================================
   DataListGroup - Group items with a label
   ============================================================================ */

interface DataListGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function DataListGroup({ label, children, className }: DataListGroupProps) {
  return (
    <div className={className}>
      <div className="px-3 py-2">
        <span className="text-[11px] font-medium text-foreground-subtle uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
