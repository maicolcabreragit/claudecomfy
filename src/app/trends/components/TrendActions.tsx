"use client";

import { GraduationCap, Radio, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionState = "idle" | "loading" | "done";

interface TrendActionsProps {
  onLearn: () => void;
  onPodcast: () => void;
  onSearch: () => void;
  learnState?: ActionState;
  podcastState?: ActionState;
  searchState?: ActionState;
  disabled?: boolean;
  className?: string;
}

/**
 * TrendActions - Action buttons for trend analysis
 * 
 * Three actions:
 * - Learn (📚) - Generate learning content from trends
 * - Podcast (🎙️) - Generate audio podcast
 * - Search (🔍) - Search for more information
 */
export function TrendActions({
  onLearn,
  onPodcast,
  onSearch,
  learnState = "idle",
  podcastState = "idle",
  searchState = "idle",
  disabled = false,
  className,
}: TrendActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Learn button */}
      <ActionButton
        icon={GraduationCap}
        label="Aprender"
        state={learnState}
        onClick={onLearn}
        disabled={disabled}
        colorClass="text-purple-400 hover:bg-purple-500/20 border-purple-500/30"
        activeClass="bg-purple-500/20"
      />

      {/* Podcast button */}
      <ActionButton
        icon={Radio}
        label="Podcast"
        state={podcastState}
        onClick={onPodcast}
        disabled={disabled || learnState !== "done"}
        colorClass="text-orange-400 hover:bg-orange-500/20 border-orange-500/30"
        activeClass="bg-orange-500/20"
      />

      {/* Search button */}
      <ActionButton
        icon={Search}
        label="Buscar"
        state={searchState}
        onClick={onSearch}
        disabled={disabled}
        colorClass="text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
        activeClass="bg-blue-500/20"
      />
    </div>
  );
}

interface ActionButtonProps {
  icon: typeof GraduationCap;
  label: string;
  state: ActionState;
  onClick: () => void;
  disabled?: boolean;
  colorClass: string;
  activeClass: string;
}

function ActionButton({
  icon: Icon,
  label,
  state,
  onClick,
  disabled,
  colorClass,
  activeClass,
}: ActionButtonProps) {
  const isLoading = state === "loading";
  const isDone = state === "done";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border",
        "text-sm font-medium transition-all duration-fast",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isDone ? activeClass : "bg-transparent",
        colorClass
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
      {isDone && <span className="text-xs opacity-70">✓</span>}
    </button>
  );
}
