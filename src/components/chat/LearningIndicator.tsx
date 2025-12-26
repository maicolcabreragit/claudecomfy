"use client";

import { useState } from "react";
import { BookOpen, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningUnit {
  id: string;
  title: string;
  completed: boolean;
}

interface ActiveModule {
  id: string;
  title: string;
  topic: string;
  progress: number;
  units: LearningUnit[];
}

interface LearningIndicatorProps {
  module: ActiveModule | null;
  onClose: () => void;
  onToggleUnit?: (unitId: string, completed: boolean) => void;
}

/**
 * LearningIndicator - Shows active learning module badge
 * 
 * Displays a subtle indicator next to chat input when user is
 * in a learning context. Expands to show progress and units.
 */
export function LearningIndicator({ 
  module, 
  onClose,
  onToggleUnit 
}: LearningIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!module) return null;

  return (
    <div className="mb-2">
      {/* Collapsed Badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
          "bg-accent-purple/10 border border-accent-purple/30 hover:border-accent-purple/50",
          expanded && "rounded-b-none"
        )}
      >
        <BookOpen className="h-4 w-4 text-accent-purple" />
        <span className="text-accent-purple font-medium">
          📚 {module.topic}
        </span>
        
        {/* Progress */}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-16 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-purple transition-all"
              style={{ width: `${module.progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{module.progress}%</span>
        </div>

        <ChevronDown className={cn(
          "h-4 w-4 text-zinc-500 ml-auto transition-transform",
          expanded && "rotate-180"
        )} />
        
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="ml-1 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </button>

      {/* Expanded Panel */}
      {expanded && module.units.length > 0 && (
        <div className="bg-surface-base border border-t-0 border-accent-purple/30 rounded-b-lg p-3">
          <p className="text-xs text-zinc-500 mb-2">Pasos de aprendizaje:</p>
          <ul className="space-y-1">
            {module.units.map((unit) => (
              <li 
                key={unit.id}
                className="flex items-center gap-2 text-sm"
              >
                <button
                  onClick={() => onToggleUnit?.(unit.id, !unit.completed)}
                  className={cn(
                    "flex-shrink-0 w-4 h-4 rounded border transition-colors",
                    unit.completed 
                      ? "bg-semantic-success border-semantic-success" 
                      : "border-zinc-600 hover:border-accent-purple"
                  )}
                >
                  {unit.completed && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </button>
                <span className={cn(
                  "text-zinc-300",
                  unit.completed && "line-through text-zinc-500"
                )}>
                  {unit.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
