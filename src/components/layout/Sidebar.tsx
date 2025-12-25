"use client";

import { useEffect } from "react";
import { 
  MessageSquare, 
  TrendingUp, 
  Archive, 
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "./NavItem";
import { useAppStore, useSidebarCollapsed } from "@/store";

const NAV_ITEMS = [
  { href: "/", icon: MessageSquare, label: "Chat" },
  { href: "/trends", icon: TrendingUp, label: "Trends" },
  { href: "/vault", icon: Archive, label: "La Bóveda" },
  { href: "/academy", icon: GraduationCap, label: "Academia" },
];

/**
 * Sidebar - Navegación principal colapsable
 * 
 * - 256px expandido, 64px colapsado
 * - Estado persiste via Zustand (localStorage)
 * - Toggle con Cmd/Ctrl+B
 */
export function Sidebar() {
  const collapsed = useSidebarCollapsed();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  // Keyboard shortcut: Cmd/Ctrl+B
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [toggleSidebar]);

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-surface-base border-r border-surface-border transition-all duration-normal ease-smooth",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-14 flex items-center border-b border-surface-border px-4",
        collapsed && "justify-center px-0"
      )}>
        {collapsed ? (
          <span className="text-xl">✨</span>
        ) : (
          <span className="text-lg font-semibold text-gradient">ComfyClaude</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-surface-border">
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expandir (⌘B)" : "Colapsar (⌘B)"}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
            "text-zinc-500 hover:text-foreground hover:bg-surface-elevated",
            "transition-colors duration-fast",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
