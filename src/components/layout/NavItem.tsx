"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: string | number;
}

/**
 * NavItem - Item de navegación reutilizable
 * 
 * - Resalta ruta activa con borde izquierdo púrpura
 * - Muestra tooltip en modo colapsado
 * - Soporte para badges (notificaciones)
 */
export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  collapsed = false,
  badge 
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || 
    (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "transition-all duration-fast ease-smooth",
        "hover:bg-surface-elevated focus-ring",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-accent-purple/10 text-foreground"
          : "text-foreground-muted hover:text-foreground"
      )}
    >
      {/* Active indicator */}
      <div className={cn(
        "absolute left-0 w-0.5 h-5 rounded-r-full transition-all duration-fast",
        isActive ? "bg-accent-purple" : "bg-transparent"
      )} />

      {/* Icon */}
      <Icon className={cn(
        "h-5 w-5 flex-shrink-0 transition-colors duration-fast",
        isActive ? "text-accent-purple" : "text-foreground-subtle group-hover:text-foreground-muted"
      )} />

      {/* Label */}
      {!collapsed && (
        <span className="text-sm font-medium truncate flex-1">{label}</span>
      )}

      {/* Badge */}
      {!collapsed && badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent-purple text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
