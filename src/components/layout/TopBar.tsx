"use client";

import { Sparkles } from "lucide-react";

/**
 * TopBar - Barra superior global
 * 
 * - Logo/branding
 * - Progreso del curso (futuro)
 * - Acciones rápidas
 * - 48px altura fija
 */
export function TopBar() {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-surface-border bg-surface-base">
      {/* Left: Breadcrumb/Context */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Sparkles className="h-4 w-4 text-accent-purple" />
        <span>ComfyClaude OS</span>
      </div>

      {/* Center: Progress (placeholder) */}
      <div className="hidden md:flex items-center gap-2">
        <div className="h-1.5 w-32 rounded-full bg-surface-elevated overflow-hidden">
          <div className="h-full w-1/4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        </div>
        <span className="text-xs text-zinc-500">Módulo 1</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">v0.1.0</span>
      </div>
    </header>
  );
}
