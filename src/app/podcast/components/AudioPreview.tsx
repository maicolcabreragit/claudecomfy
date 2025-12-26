"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPreviewProps {
  audioUrl: string | null;
  isLoading?: boolean;
  onGenerate?: () => void;
  className?: string;
}

/**
 * AudioPreview - Mini audio player for voice previews
 */
export function AudioPreview({
  audioUrl,
  isLoading = false,
  onGenerate,
  className,
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Reset when URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // No audio yet
  if (!audioUrl && !isLoading) {
    return (
      <div className={cn(
        "rounded-lg border border-dashed border-surface-border",
        "bg-surface-base p-4",
        className
      )}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Volume2 className="h-8 w-8 text-zinc-600" />
          <div className="text-sm text-zinc-500">
            Genera un preview para escuchar cómo sonará
          </div>
          {onGenerate && (
            <button
              type="button"
              onClick={onGenerate}
              className={cn(
                "px-4 py-2 text-sm rounded-lg",
                "bg-accent-purple text-white",
                "hover:bg-accent-purple/90 transition-colors"
              )}
            >
              Generar Preview
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-lg border border-surface-border",
        "bg-surface-elevated p-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-accent-purple animate-spin" />
          <span className="text-sm text-zinc-400">Generando preview...</span>
        </div>
      </div>
    );
  }

  // Audio player
  return (
    <div className={cn(
      "rounded-lg border border-surface-border",
      "bg-surface-elevated p-3",
      className
    )}>
      <audio ref={audioRef} src={audioUrl!} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "p-2 rounded-full",
            "bg-accent-purple text-white",
            "hover:bg-accent-purple/90 transition-colors"
          )}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={cn(
              "w-full h-1.5 rounded-full appearance-none cursor-pointer",
              "bg-surface-border",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3",
              "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:cursor-pointer"
            )}
            style={{
              background: `linear-gradient(to right, rgb(139, 92, 246) ${progress}%, rgb(63, 63, 70) ${progress}%)`,
            }}
          />
        </div>

        {/* Time display */}
        <div className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Regenerate button */}
      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          className="mt-2 w-full text-xs text-zinc-500 hover:text-foreground transition-colors"
        >
          Regenerar preview
        </button>
      )}
    </div>
  );
}
