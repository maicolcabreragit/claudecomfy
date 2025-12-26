"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { NavItem } from "./NavItem";

interface NavGroupItem {
  href: string;
  label: string;
  badge?: string | number;
}

interface NavGroupProps {
  icon: LucideIcon;
  label: string;
  items: NavGroupItem[];
  collapsed?: boolean;
  defaultOpen?: boolean;
}

/**
 * NavGroup - Grupo de navegación colapsable
 * 
 * Usado para agrupar items relacionados (ej: cursos bajo Academia)
 */
export function NavGroup({
  icon: Icon,
  label,
  items,
  collapsed = false,
  defaultOpen = false,
}: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // In collapsed mode, show just the icon
  if (collapsed) {
    return (
      <button
        title={label}
        className={cn(
          "w-full flex items-center justify-center p-2.5 rounded-lg",
          "text-foreground-muted hover:text-foreground hover:bg-surface-elevated",
          "transition-all duration-fast focus-ring"
        )}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="space-y-1">
      {/* Group header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "text-foreground-muted hover:text-foreground hover:bg-surface-elevated",
          "transition-all duration-fast focus-ring"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1 text-left">{label}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-fast",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Group items */}
      {isOpen && (
        <div className="ml-4 pl-3 border-l border-border-subtle space-y-0.5">
          {items.map((item) => (
            <NavSubItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NavSubItem - Item dentro de un NavGroup
 */
function NavSubItem({ href, label, badge }: NavGroupItem) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "text-sm text-foreground-muted hover:text-foreground hover:bg-surface-elevated",
        "transition-all duration-fast"
      )}
    >
      <span className="truncate flex-1">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent-purple/20 text-accent-purple">
          {badge}
        </span>
      )}
    </a>
  );
}
