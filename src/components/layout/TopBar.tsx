"use client";

import { Sparkles, HelpCircle, Settings, Keyboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * TopBar - Barra superior global (48px altura)
 * 
 * Layout:
 * [Logo] ComfyClaude OS     [Progreso]     [?] [⚙️]
 */
export function TopBar() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b border-border-subtle bg-surface-base shrink-0">
        {/* Left: Logo + Branding */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-purple" />
          <span className="text-sm font-semibold text-foreground">ComfyClaude OS</span>
          <span className="text-xs text-foreground-subtle px-1.5 py-0.5 rounded bg-surface-elevated">
            Beta
          </span>
        </div>

        {/* Center: Progress bar (curso actual) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-foreground-muted">Módulo 1: Fundamentos</span>
            <div className="h-1.5 w-40 rounded-full bg-surface-overlay overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-slow"
                style={{ width: '25%' }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-accent-purple">25%</span>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {/* Shortcuts help */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={cn(
              "p-2 rounded-lg transition-colors duration-fast",
              "text-foreground-subtle hover:text-foreground hover:bg-surface-elevated",
              "focus-ring"
            )}
            title="Atajos de teclado"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Help */}
          <button
            className={cn(
              "p-2 rounded-lg transition-colors duration-fast",
              "text-foreground-subtle hover:text-foreground hover:bg-surface-elevated",
              "focus-ring"
            )}
            title="Ayuda"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => window.location.href = '/settings'}
            className={cn(
              "p-2 rounded-lg transition-colors duration-fast",
              "text-foreground-subtle hover:text-foreground hover:bg-surface-elevated",
              "focus-ring"
            )}
            title="Ajustes (⌘,)"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Shortcuts overlay */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-surface-elevated border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-foreground">Atajos de Teclado</h2>
            <div className="space-y-2 text-sm">
              <ShortcutRow keys={["⌘", "B"]} description="Toggle sidebar" />
              <ShortcutRow keys={["⌘", ","]} description="Abrir ajustes" />
              <ShortcutRow keys={["⌘", "K"]} description="Búsqueda rápida" />
              <ShortcutRow keys={["⌘", "N"]} description="Nueva conversación" />
              <ShortcutRow keys={["⌘", "Enter"]} description="Enviar mensaje" />
              <ShortcutRow keys={["Esc"]} description="Cerrar modal/cancelar" />
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2 text-sm text-foreground-muted hover:text-foreground bg-surface-overlay rounded-lg transition-colors"
            >
              Cerrar (Esc)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-foreground-muted">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 text-xs font-mono bg-surface-overlay border border-border-subtle rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
