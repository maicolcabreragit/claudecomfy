"use client";

import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  hasContext: boolean;
}

/**
 * EmptyState - Welcome screen when no messages
 */
export function EmptyState({ hasContext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
        ComfyClaude OS
      </h1>
      <p className="text-zinc-500 max-w-md">
        Tu interfaz Claude optimizada en costes con inyección de conocimiento y razonamiento extendido.
      </p>
      <p className="text-zinc-600 text-sm mt-2">
        Arrastra y suelta imágenes para análisis visual
      </p>
      {hasContext && (
        <div className="mt-4 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm">
          ✓ Contexto de conocimiento cargado
        </div>
      )}
    </div>
  );
}
