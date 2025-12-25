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
}

/**
 * NavItem - Item de navegación reutilizable
 * 
 * - Resalta ruta activa con borde izquierdo púrpura
 * - Muestra tooltip en modo colapsado
 */
export function NavItem({ href, icon: Icon, label, collapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-fast ease-smooth",
        "hover:bg-surface-elevated",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-accent-purple/10 border-l-2 border-accent-purple text-foreground"
          : "text-zinc-400 hover:text-foreground border-l-2 border-transparent"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-accent-purple")} />
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </Link>
  );
}
