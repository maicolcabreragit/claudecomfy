"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Loader2,
  X,
  Volume2,
  Star,
  Check,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Voice, VoiceSettings } from "./types";

interface VoiceCompareProps {
  voices: Voice[];
  voiceIds: string[];
  settings?: VoiceSettings;
  onClose: () => void;
  onSelectVoice: (voiceId: string) => void;
  className?: string;
}

interface GeneratedAudio {
  voiceId: string;
  audioUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_COMPARE_TEXT = `Hola, bienvenidos de vuelta a IA Sin Filtros. Hoy te traigo algo que probablemente no sabías: esta semana una empresa logró crear imágenes TAN realistas que ni los expertos pueden distinguirlas de fotos reales.`;

/**
 * VoiceCompare - Compare multiple voices with the same text
 */
export function VoiceCompare({
  voices,
  voiceIds,
  settings,
  onClose,
  onSelectVoice,
  className,
}: VoiceCompareProps) {
  const [compareText, setCompareText] = useState(DEFAULT_COMPARE_TEXT);
  const [audios, setAudios] = useState<GeneratedAudio[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [playbackOrder, setPlaybackOrder] = useState<string[]>([]);
  const [orderIndex, setOrderIndex] = useState(0);
  const [isSequentialPlay, setIsSequentialPlay] = useState(false);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const selectedVoices = voiceIds
    .map((id) => voices.find((v) => v.voice_id === id))
    .filter(Boolean) as Voice[];

  // Initialize audio states
  useEffect(() => {
    setAudios(
      voiceIds.map((id) => ({
        voiceId: id,
        audioUrl: null,
        isLoading: false,
        error: null,
      }))
    );
  }, [voiceIds]);

  // Generate audio for all voices
  const generateAll = async () => {
    // Stop any playing audio
    stopAllAudio();

    // Set all to loading
    setAudios((prev) =>
      prev.map((a) => ({ ...a, isLoading: true, error: null, audioUrl: null }))
    );

    // Generate in parallel
    const promises = voiceIds.map(async (voiceId) => {
      try {
        const res = await fetch("/api/elevenlabs/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: compareText,
            voiceId,
            settings,
          }),
        });

        const data = await res.json();

        if (data.success) {
          return { voiceId, audioUrl: data.audio, isLoading: false, error: null };
        } else {
          return { voiceId, audioUrl: null, isLoading: false, error: data.error };
        }
      } catch (error) {
        return {
          voiceId,
          audioUrl: null,
          isLoading: false,
          error: "Error de conexión",
        };
      }
    });

    const results = await Promise.all(promises);
    setAudios(results);
  };

  // Play a specific voice
  const playVoice = (voiceId: string) => {
    stopAllAudio();

    const audio = audios.find((a) => a.voiceId === voiceId);
    if (!audio?.audioUrl) return;

    const audioElement = new Audio(audio.audioUrl);
    audioRefs.current.set(voiceId, audioElement);

    audioElement.onended = () => {
      setCurrentPlaying(null);
      if (isSequentialPlay) {
        // Play next in sequence
        const nextIndex = orderIndex + 1;
        if (nextIndex < playbackOrder.length) {
          setOrderIndex(nextIndex);
          playVoice(playbackOrder[nextIndex]);
        } else {
          setIsSequentialPlay(false);
          setOrderIndex(0);
        }
      }
    };

    audioElement.play();
    setCurrentPlaying(voiceId);
  };

  // Stop all audio
  const stopAllAudio = () => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current.clear();
    setCurrentPlaying(null);
  };

  // Play all in sequence
  const playSequential = () => {
    const order = voiceIds.filter((id) =>
      audios.find((a) => a.voiceId === id && a.audioUrl)
    );

    if (order.length === 0) return;

    setPlaybackOrder(order);
    setOrderIndex(0);
    setIsSequentialPlay(true);
    playVoice(order[0]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const allGenerated = audios.every((a) => a.audioUrl !== null || a.error !== null);
  const anyLoading = audios.some((a) => a.isLoading);
  const allHaveAudio = audios.every((a) => a.audioUrl !== null);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60",
        className
      )}
    >
      <div className="w-full max-w-3xl bg-surface-elevated border border-surface-border rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Comparar Voces
            </h2>
            <p className="text-sm text-zinc-500">
              Escucha {selectedVoices.length} voces con el mismo texto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Text input */}
        <div className="p-6 border-b border-surface-border">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Texto de prueba
          </label>
          <textarea
            value={compareText}
            onChange={(e) => setCompareText(e.target.value)}
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-lg resize-none",
              "bg-surface-base border border-surface-border",
              "text-foreground text-sm",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            )}
            placeholder="Escribe el texto que quieres escuchar..."
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-zinc-500">
              {compareText.length} caracteres
            </span>
            <Button
              onClick={generateAll}
              disabled={!compareText.trim() || anyLoading}
              isLoading={anyLoading}
              leftIcon={RefreshCw}
            >
              {allGenerated ? "Regenerar" : "Generar audios"}
            </Button>
          </div>
        </div>

        {/* Voice comparison cards */}
        <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
          {selectedVoices.map((voice) => {
            const audio = audios.find((a) => a.voiceId === voice.voice_id);
            const isPlaying = currentPlaying === voice.voice_id;
            const hasAudio = audio?.audioUrl !== null;

            return (
              <div
                key={voice.voice_id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg",
                  "bg-surface-base border border-surface-border",
                  isPlaying && "border-accent-purple"
                )}
              >
                {/* Voice info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {voice.name}
                    </span>
                    {voice.isRecommended && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {voice.labels?.accent} • {voice.labels?.gender}
                  </div>
                </div>

                {/* Audio controls */}
                <div className="flex items-center gap-2">
                  {audio?.isLoading ? (
                    <Loader2 className="h-5 w-5 text-accent-purple animate-spin" />
                  ) : audio?.error ? (
                    <span className="text-xs text-semantic-error">
                      {audio.error}
                    </span>
                  ) : hasAudio ? (
                    <button
                      onClick={() =>
                        isPlaying ? stopAllAudio() : playVoice(voice.voice_id)
                      }
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isPlaying
                          ? "bg-accent-purple text-white"
                          : "bg-surface-elevated text-zinc-400 hover:text-foreground"
                      )}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <Volume2 className="h-5 w-5 text-zinc-600" />
                  )}

                  {/* Select button */}
                  <button
                    onClick={() => onSelectVoice(voice.voice_id)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg transition-colors",
                      "bg-surface-elevated text-zinc-400",
                      "hover:bg-accent-purple hover:text-white"
                    )}
                  >
                    Usar esta
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
          <span className="text-xs text-zinc-500">
            Tip: Escucha las voces con fragmentos del tipo de contenido real que
            crearás
          </span>

          {allHaveAudio && (
            <Button
              variant="outline"
              onClick={playSequential}
              disabled={isSequentialPlay}
              leftIcon={Play}
            >
              Reproducir todas
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
