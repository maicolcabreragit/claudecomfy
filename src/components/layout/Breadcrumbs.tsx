"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

/**
 * Breadcrumbs - Navegación jerárquica
 * 
 * Modo automático: genera breadcrumbs desde la URL
 * Modo manual: usa items[] pasados como prop
 */
export function Breadcrumbs({ 
  items, 
  showHome = true,
  className 
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items ?? generateFromPathname(pathname);
  
  // Prepend home if requested
  const allItems: BreadcrumbItem[] = showHome 
    ? [{ label: "Home", href: "/" }, ...breadcrumbs]
    : breadcrumbs;

  if (allItems.length <= 1) return null;

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.href ?? item.label} className="flex items-center">
            {/* Separator */}
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 mx-1 text-foreground-subtle" />
            )}
            
            {/* Item */}
            {isLast ? (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "text-foreground-muted hover:text-foreground transition-colors duration-fast",
                  "flex items-center gap-1"
                )}
              >
                {isFirst && showHome && <Home className="h-3.5 w-3.5" />}
                {!isFirst && <span className="truncate max-w-[150px]">{item.label}</span>}
              </Link>
            ) : (
              <span className="text-foreground-subtle">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Generate breadcrumb items from pathname
 */
function generateFromPathname(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  
  // Route labels mapping
  const labels: Record<string, string> = {
    "trends": "Trends",
    "vault": "La Bóveda",
    "academy": "Academia",
    "settings": "Ajustes",
    "docs": "Documentación",
  };

  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = labels[segment] ?? formatSegment(segment);
    items.push({
      label,
      href: currentPath,
    });
  }

  return items;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegment(segment: string): string {
  // Handle UUIDs - show shortened version
  if (segment.match(/^[a-f0-9-]{36}$/i)) {
    return `#${segment.slice(0, 8)}`;
  }
  
  // Convert kebab-case to Title Case
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
