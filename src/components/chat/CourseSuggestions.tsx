"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  text: string;
  category?: "question" | "example" | "help";
}

interface CourseSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (text: string) => void;
  className?: string;
}

/**
 * CourseSuggestions - Floating chips above input with contextual suggestions
 * 
 * Based on current lesson context, suggests relevant questions/actions
 */
export function CourseSuggestions({
  suggestions,
  onSelect,
  className,
}: CourseSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const categoryColors = {
    question: "border-accent-purple/30 hover:border-accent-purple/50 text-accent-purple",
    example: "border-semantic-success/30 hover:border-semantic-success/50 text-semantic-success",
    help: "border-semantic-warning/30 hover:border-semantic-warning/50 text-semantic-warning",
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <div className="flex items-center gap-1.5 text-xs text-foreground-subtle mr-2">
        <Sparkles className="h-3 w-3" />
        <span>Sugerencias:</span>
      </div>
      
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion.text)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium",
            "border bg-surface-base/50 backdrop-blur-sm",
            "transition-all duration-fast hover:bg-surface-elevated",
            "focus-ring",
            categoryColors[suggestion.category || "question"]
          )}
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
}

/**
 * Generate suggestions based on lesson context
 */
export function generateLessonSuggestions(
  lessonTitle: string,
  completedSteps: string[],
  currentStep?: string
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Always add a help option
  suggestions.push({
    id: "explain",
    text: `Explícame ${lessonTitle}`,
    category: "question",
  });

  // If there's a current step, add specific suggestions
  if (currentStep) {
    suggestions.push({
      id: "step-help",
      text: `¿Cómo hago "${currentStep}"?`,
      category: "help",
    });
    
    suggestions.push({
      id: "step-example",
      text: "Muéstrame un ejemplo",
      category: "example",
    });
  }

  // Add common ComfyUI questions if related
  if (lessonTitle.toLowerCase().includes("nodo") || lessonTitle.toLowerCase().includes("node")) {
    suggestions.push({
      id: "node-install",
      text: "¿Cómo instalo este nodo?",
      category: "help",
    });
  }

  if (lessonTitle.toLowerCase().includes("workflow")) {
    suggestions.push({
      id: "workflow-export",
      text: "¿Cómo exporto este workflow?",
      category: "help",
    });
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}
