"use client";

import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  TrendingUp, 
  Archive, 
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "./NavItem";
import { NavGroup } from "./NavGroup";
import { useAppStore, useSidebarCollapsed } from "@/store";
import { useRouter } from "next/navigation";

// Main navigation items
const NAV_ITEMS = [
  { href: "/", icon: MessageSquare, label: "Chat", badgeKey: "chat" },
  { href: "/trends", icon: TrendingUp, label: "Trends", badgeKey: "trends" },
  { href: "/vault", icon: Archive, label: "La Bóveda", badgeKey: "vault" },
];

// Academy courses (example - could be fetched)
const ACADEMY_COURSES = [
  { href: "/academy", label: "Dashboard" },
  { href: "/academy/comfyui-basics", label: "ComfyUI Básico", badge: "3" },
  { href: "/academy/advanced-nodes", label: "Nodos Avanzados" },
];

// Resource items
const RESOURCE_ITEMS = [
  { href: "/docs", icon: BookOpen, label: "Docs" },
];

/**
 * Sidebar - Navegación principal colapsable
 * 
 * - 240px expandido (w-60), 64px colapsado (w-16)
 * - Estado persiste via Zustand (localStorage)
 * - Toggle con Cmd/Ctrl+B
 * - Badges dinámicos para notificaciones
 */
export function Sidebar() {
  const collapsed = useSidebarCollapsed();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const router = useRouter();
  
  // Dynamic badges (could be fetched from API)
  const [badges, setBadges] = useState<Record<string, number>>({
    trends: 0,
    vault: 0,
    chat: 0,
  });

  // Fetch badge counts
  useEffect(() => {
    async function fetchBadges() {
      try {
        // Example: fetch new trends count
        const trendsRes = await fetch("/api/trends?limit=1");
        if (trendsRes.ok) {
          const data = await trendsRes.json();
          // Count trends from last 24h as "new"
          const newCount = data.trends?.filter((t: { createdAt: string }) => {
            const age = Date.now() - new Date(t.createdAt).getTime();
            return age < 24 * 60 * 60 * 1000;
          }).length || 0;
          setBadges(prev => ({ ...prev, trends: newCount }));
        }
      } catch {
        // Silently fail
      }
    }
    fetchBadges();
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+B (sidebar), Cmd/Ctrl+, (settings)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [toggleSidebar, router]);

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-surface-base border-r border-border-subtle transition-all duration-normal ease-smooth shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo section */}
      <div className={cn(
        "h-12 flex items-center border-b border-border-subtle px-4",
        collapsed && "justify-center px-0"
      )}>
        {collapsed ? (
          <Sparkles className="h-5 w-5 text-accent-purple" />
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-purple" />
            <span className="text-base font-semibold text-gradient">ComfyClaude</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Section: Principal */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium text-foreground-subtle uppercase tracking-wider">
              Principal
            </span>
          </div>
        )}
        
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            badge={badges[item.badgeKey] > 0 ? badges[item.badgeKey] : undefined}
          />
        ))}

        {/* Academy with submenu */}
        {collapsed ? (
          <NavItem
            href="/academy"
            icon={GraduationCap}
            label="Academia"
            collapsed={collapsed}
          />
        ) : (
          <NavGroup
            icon={GraduationCap}
            label="Academia"
            items={ACADEMY_COURSES}
            collapsed={collapsed}
            defaultOpen={false}
          />
        )}

        {/* Separator */}
        <div className="my-3 border-t border-border-subtle" />

        {/* Section: Recursos */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-[11px] font-medium text-foreground-subtle uppercase tracking-wider">
              Recursos
            </span>
          </div>
        )}

        {RESOURCE_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Settings - Separated at bottom */}
      <div className="p-2 border-t border-border-subtle">
        <NavItem
          href="/settings"
          icon={Settings}
          label="Ajustes"
          collapsed={collapsed}
        />
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border-subtle">
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expandir (⌘B)" : "Colapsar (⌘B)"}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
            "text-foreground-subtle hover:text-foreground hover:bg-surface-elevated",
            "transition-colors duration-fast focus-ring",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs flex-1">Colapsar</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                ⌘B
              </kbd>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
