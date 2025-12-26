"use client";

import { Loader2, BookOpen } from "lucide-react";
import { ModuleCard } from "./ModuleCard";

// ============================================================================
// Types
// ============================================================================

interface LearningUnit {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface LearningModule {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  progress: number;
  conversationId: string | null;
  isManual: boolean;
  units: LearningUnit[];
  createdAt: string;
  updatedAt: string;
}

interface ModuleListProps {
  modules: LearningModule[];
  isLoading: boolean;
  onModuleUpdate: () => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ModuleList({ 
  modules, 
  isLoading, 
  onModuleUpdate, 
  onDelete 
}: ModuleListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-surface-elevated animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-base rounded-xl border border-surface-border">
        <div className="p-4 bg-purple-500/10 rounded-full w-fit mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="font-medium text-zinc-300 mb-2">
          No tienes cursos aún
        </h3>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          Los cursos se crean automáticamente cuando preguntas &quot;cómo hacer...&quot; 
          en el chat, o puedes crear uno manualmente.
        </p>
      </div>
    );
  }

  // Sort: ACTIVE first, then by updatedAt
  const sortedModules = [...modules].sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedModules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onModuleUpdate={onModuleUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
