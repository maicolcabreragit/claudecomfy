"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  X,
  GripVertical,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePodcastQueueStore, useQueueCount, useEstimatedDuration, useCanGenerateEpisode } from "@/store/usePodcastQueueStore";

interface PodcastQueuePanelProps {
  className?: string;
}

/**
 * Floating panel showing the current podcast episode queue.
 * Appears when there are trends in the queue.
 */
export function PodcastQueuePanel({ className }: PodcastQueuePanelProps) {
  const router = useRouter();
  const { queue, removeFromQueue, reorderQueue, clearQueue, markAsUsed, getQueueIds } = usePodcastQueueStore();
  const queueCount = useQueueCount();
  const estimatedDuration = useEstimatedDuration();
  const canGenerate = useCanGenerateEpisode();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Don't render if queue is empty
  if (queueCount === 0) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `~${mins} min`;
  };

  // Generate episode
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const trendIds = getQueueIds();
      
      // Generate script using the queue
      const res = await fetch("/api/podcast/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendIds,
          saveAsDraft: true,
        }),
      });

      const data = await res.json();

      if (data.success && data.episodeId) {
        // Mark trends as used
        markAsUsed(trendIds);
        // Clear the queue
        clearQueue();
        // Navigate to editor
        router.push(`/podcast/editor/${data.episodeId}`);
      }
    } catch (error) {
      console.error("Generate error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderQueue(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "w-80 rounded-xl shadow-2xl",
        "bg-surface-elevated border border-orange-500/30",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          "bg-gradient-to-r from-orange-500/20 to-red-500/20",
          "border-b border-surface-border cursor-pointer"
        )}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-orange-400" />
          <span className="font-medium text-foreground">
            Cola de Episodio
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
            {queueCount}
          </span>
        </div>
        
        <button className="text-zinc-400 hover:text-foreground transition-colors">
          {isMinimized ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Queue list */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {queue.map((trend, index) => (
              <div
                key={trend.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  "bg-surface-base border border-surface-border",
                  "group transition-all cursor-grab active:cursor-grabbing",
                  draggedIndex === index && "opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-zinc-600 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground line-clamp-1">
                    {trend.title}
                  </div>
                  <div className="text-xs text-zinc-500">
                    🔥 {trend.heatScore}
                  </div>
                </div>
                
                <button
                  onClick={() => removeFromQueue(trend.id)}
                  className={cn(
                    "p-1 rounded text-zinc-500",
                    "opacity-0 group-hover:opacity-100",
                    "hover:text-semantic-error hover:bg-semantic-error/10",
                    "transition-all"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-surface-border space-y-3">
            {/* Duration estimate */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="h-3.5 w-3.5" />
                Duración estimada
              </span>
              <span className="text-foreground font-medium">
                {formatDuration(estimatedDuration)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQueue}
                className="flex-1"
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                isLoading={isGenerating}
                leftIcon={Sparkles}
                className="flex-1"
              >
                Generar
              </Button>
            </div>

            {!canGenerate && (
              <p className="text-xs text-zinc-500 text-center">
                Añade al menos 2 trends para generar
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
