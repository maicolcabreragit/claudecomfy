"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Radio, Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  onClose: () => void;
  onDownload: () => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2];

/**
 * AudioPlayer - Sticky audio player for podcasts
 * 
 * Features:
 * - Play/Pause controls
 * - Progress bar with seeking
 * - Playback speed control (1x, 1.25x, 1.5x, 1.75x, 2x)
 * - Download button
 * - Close button
 */
export function AudioPlayer({ 
  audioUrl, 
  title = "Podcast de Tendencias",
  onClose, 
  onDownload,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
  }, []);

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

  const cycleSpeed = () => {
    const nextIndex = (PLAYBACK_SPEEDS.indexOf(playbackSpeed) + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-toast",
      "bg-gradient-to-r from-orange-900/95 to-red-900/95 backdrop-blur-lg",
      "border-t border-orange-500/30",
      className
    )}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Progress bar (full width) */}
      <div className="h-1 bg-white/10">
        <div 
          className="h-full bg-orange-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-2 bg-orange-500 rounded-full text-white hover:bg-orange-400 transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        {/* Title and time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{title}</span>
          </div>
          <div className="text-xs text-orange-200/70 mt-0.5">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </div>
        </div>

        {/* Seek bar (hidden on mobile) */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="hidden md:block w-48 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
        />

        {/* Speed control */}
        <button
          onClick={cycleSpeed}
          className="px-2 py-1 text-xs font-medium bg-white/10 rounded text-white hover:bg-white/20 transition-colors"
        >
          {playbackSpeed}x
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          className="p-2 text-white/70 hover:text-white transition-colors"
          title="Descargar"
        >
          <Download className="h-4 w-4" />
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
