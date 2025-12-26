"use client";

import { useMemo } from "react";
import { Coins, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditEstimatorProps {
  text: string;
  remainingCredits?: number;
  className?: string;
}

const CHARS_PER_CREDIT = 30;
const WORDS_PER_MINUTE = 150;

/**
 * CreditEstimator - Shows estimated credits and duration for script
 */
export function CreditEstimator({
  text,
  remainingCredits,
  className,
}: CreditEstimatorProps) {
  const estimates = useMemo(() => {
    const chars = text.length;
    const cleanText = text.replace(/<[^>]+>/g, "").replace(/\[[^\]]+\]/g, "");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;
    
    const credits = Math.ceil(chars / CHARS_PER_CREDIT);
    const durationSeconds = Math.round((words / WORDS_PER_MINUTE) * 60);
    
    return { chars, words, credits, durationSeconds };
  }, [text]);

  const isOverBudget = remainingCredits !== undefined && estimates.credits > remainingCredits;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn(
      "rounded-lg border border-surface-border",
      "bg-surface-base p-4",
      className
    )}>
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Estimación
      </div>

      <div className="space-y-3">
        {/* Credits */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Coins className="h-4 w-4" />
            <span>Créditos</span>
          </div>
          <div className={cn(
            "text-sm font-medium",
            isOverBudget ? "text-semantic-error" : "text-foreground"
          )}>
            ~{estimates.credits.toLocaleString()}
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="h-4 w-4" />
            <span>Duración</span>
          </div>
          <div className="text-sm font-medium text-foreground">
            ~{formatDuration(estimates.durationSeconds)}
          </div>
        </div>

        {/* Characters */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{estimates.chars.toLocaleString()} caracteres</span>
          <span>{estimates.words.toLocaleString()} palabras</span>
        </div>

        {/* Remaining credits info */}
        {remainingCredits !== undefined && (
          <div className={cn(
            "pt-3 mt-3 border-t border-surface-border",
            "flex items-center justify-between"
          )}>
            <span className="text-xs text-zinc-500">Créditos disponibles</span>
            <span className={cn(
              "text-sm font-medium",
              remainingCredits < 10000 ? "text-yellow-500" : "text-green-500"
            )}>
              {remainingCredits.toLocaleString()}
            </span>
          </div>
        )}

        {/* Warning if over budget */}
        {isOverBudget && (
          <div className={cn(
            "flex items-center gap-2 p-2 rounded",
            "bg-semantic-error/10 text-semantic-error text-xs"
          )}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>No tienes suficientes créditos para este episodio</span>
          </div>
        )}
      </div>
    </div>
  );
}
