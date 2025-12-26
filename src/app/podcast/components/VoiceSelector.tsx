"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Play, Pause, Star, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Voice } from "./types";

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  voices: Voice[];
  isLoading?: boolean;
  className?: string;
}

/**
 * VoiceSelector - Dropdown to select voice with audio preview
 */
export function VoiceSelector({
  value,
  onChange,
  voices,
  isLoading = false,
  className,
}: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedVoice = voices.find(v => v.voice_id === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Play voice preview
  const playPreview = (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!voice.preview_url) return;
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingId === voice.voice_id) {
      setPlayingId(null);
      return;
    }
    
    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
    
    audio.onended = () => setPlayingId(null);
    audio.onpause = () => setPlayingId(null);
    audio.play();
    
    setPlayingId(voice.voice_id);
  };

  // Group voices by recommendation
  const recommendedVoices = voices.filter(v => v.isRecommended);
  const otherVoices = voices.filter(v => !v.isRecommended);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "px-3 py-2 rounded-lg",
          "bg-surface-elevated border border-surface-border",
          "text-foreground text-sm",
          "hover:bg-surface-overlay hover:border-accent-purple/30",
          "transition-colors",
          "disabled:opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-zinc-500" />
          <span>
            {selectedVoice?.name || "Seleccionar voz"}
          </span>
          {selectedVoice?.isRecommended && (
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-zinc-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-1 w-full",
          "bg-surface-elevated border border-surface-border rounded-lg",
          "shadow-lg shadow-black/50",
          "max-h-80 overflow-y-auto"
        )}>
          {isLoading ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              Cargando voces...
            </div>
          ) : voices.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">
              No hay voces disponibles
            </div>
          ) : (
            <>
              {/* Recommended voices */}
              {recommendedVoices.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide bg-surface-base">
                    ⭐ Recomendadas para podcasts
                  </div>
                  {recommendedVoices.map((voice) => (
                    <VoiceOption
                      key={voice.voice_id}
                      voice={voice}
                      isSelected={voice.voice_id === value}
                      isPlaying={playingId === voice.voice_id}
                      onSelect={() => {
                        onChange(voice.voice_id);
                        setIsOpen(false);
                      }}
                      onPlay={(e) => playPreview(voice, e)}
                    />
                  ))}
                </>
              )}

              {/* Other voices */}
              {otherVoices.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide bg-surface-base border-t border-surface-border">
                    Otras voces en español
                  </div>
                  {otherVoices.map((voice) => (
                    <VoiceOption
                      key={voice.voice_id}
                      voice={voice}
                      isSelected={voice.voice_id === value}
                      isPlaying={playingId === voice.voice_id}
                      onSelect={() => {
                        onChange(voice.voice_id);
                        setIsOpen(false);
                      }}
                      onPlay={(e) => playPreview(voice, e)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface VoiceOptionProps {
  voice: Voice;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: (e: React.MouseEvent) => void;
}

function VoiceOption({ voice, isSelected, isPlaying, onSelect, onPlay }: VoiceOptionProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer",
        "hover:bg-surface-overlay transition-colors",
        isSelected && "bg-accent-purple/10"
      )}
      onClick={onSelect}
    >
      {/* Play preview button */}
      {voice.preview_url && (
        <button
          type="button"
          onClick={onPlay}
          className={cn(
            "p-1.5 rounded-full",
            "bg-surface-base hover:bg-accent-purple/20",
            "text-zinc-400 hover:text-accent-purple",
            "transition-colors"
          )}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground truncate">{voice.name}</span>
          {voice.isRecommended && (
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
          )}
        </div>
        {voice.labels && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {voice.labels.gender && <span>{voice.labels.gender}</span>}
            {voice.labels.accent && <span>• {voice.labels.accent}</span>}
            {voice.labels.age && <span>• {voice.labels.age}</span>}
          </div>
        )}
      </div>

      {/* Podcast score indicator */}
      {voice.podcastScore && voice.podcastScore >= 7 && (
        <div className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
          {voice.podcastScore}/10
        </div>
      )}
    </div>
  );
}
