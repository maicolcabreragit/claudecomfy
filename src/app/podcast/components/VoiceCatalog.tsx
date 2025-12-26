"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Star,
  Check,
  X,
  Filter,
  Mic,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Voice } from "./types";

interface VoiceCatalogProps {
  voices: Voice[];
  selectedVoiceId?: string;
  onSelect?: (voiceId: string) => void;
  onCompare?: (voiceIds: string[]) => void;
  isLoading?: boolean;
  className?: string;
}

type AccentFilter = "all" | "spain" | "mexico" | "argentina" | "colombia" | "neutral";
type GenderFilter = "all" | "male" | "female" | "neutral";
type StyleFilter = "all" | "narrative" | "conversational" | "professional" | "energetic";

const ACCENT_OPTIONS: { value: AccentFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "spain", label: "🇪🇸 España" },
  { value: "mexico", label: "🇲🇽 México" },
  { value: "argentina", label: "🇦🇷 Argentina" },
  { value: "colombia", label: "🇨🇴 Colombia" },
  { value: "neutral", label: "🌎 Neutro" },
];

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "male", label: "Masculina" },
  { value: "female", label: "Femenina" },
  { value: "neutral", label: "Neutra" },
];

const STYLE_OPTIONS: { value: StyleFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "narrative", label: "Narrativo" },
  { value: "conversational", label: "Conversacional" },
  { value: "professional", label: "Profesional" },
  { value: "energetic", label: "Energético" },
];

/**
 * VoiceCatalog - Grid view of available voices with filtering
 */
export function VoiceCatalog({
  voices,
  selectedVoiceId,
  onSelect,
  onCompare,
  isLoading = false,
  className,
}: VoiceCatalogProps) {
  const [accentFilter, setAccentFilter] = useState<AccentFilter>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter voices
  const filteredVoices = voices.filter((voice) => {
    // Recommended filter
    if (onlyRecommended && !voice.isRecommended) return false;

    const labels = voice.labels || {};
    const accent = labels.accent?.toLowerCase() || "";
    const gender = labels.gender?.toLowerCase() || "";
    const styleArr = voice.style || [];

    // Accent filter
    if (accentFilter !== "all") {
      const accentMap: Record<AccentFilter, string[]> = {
        all: [],
        spain: ["spanish", "spain", "castellano", "castilian"],
        mexico: ["mexican", "mexico"],
        argentina: ["argentine", "argentina"],
        colombia: ["colombian", "colombia"],
        neutral: ["neutral", "latin", "latino"],
      };
      const matchAccent = accentMap[accentFilter].some(
        (a) => accent.includes(a)
      );
      if (!matchAccent) return false;
    }

    // Gender filter
    if (genderFilter !== "all") {
      if (!gender.includes(genderFilter)) return false;
    }

    // Style filter
    if (styleFilter !== "all") {
      if (!styleArr.includes(styleFilter)) return false;
    }

    return true;
  });

  // Toggle voice in comparison
  const toggleCompare = (voiceId: string) => {
    if (compareSelection.includes(voiceId)) {
      setCompareSelection(compareSelection.filter((id) => id !== voiceId));
    } else if (compareSelection.length < 3) {
      setCompareSelection([...compareSelection, voiceId]);
    }
  };

  // Play voice preview
  const playPreview = (voice: Voice) => {
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startComparison = () => {
    if (onCompare && compareSelection.length > 1) {
      onCompare(compareSelection);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Filters bar */}
      <div className="shrink-0 p-4 border-b border-surface-border bg-surface-elevated">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Filtros:</span>
          </div>

          {/* Accent filter */}
          <select
            value={accentFilter}
            onChange={(e) => setAccentFilter(e.target.value as AccentFilter)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg",
              "bg-surface-base border border-surface-border",
              "text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            )}
          >
            {ACCENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Gender filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg",
              "bg-surface-base border border-surface-border",
              "text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            )}
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Style filter */}
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as StyleFilter)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg",
              "bg-surface-base border border-surface-border",
              "text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            )}
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Recommended only */}
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyRecommended}
              onChange={(e) => setOnlyRecommended(e.target.checked)}
              className="rounded border-surface-border bg-surface-base text-accent-purple focus:ring-accent-purple/50"
            />
            Solo recomendadas
          </label>

          <div className="flex-1" />

          {/* Compare mode toggle */}
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setCompareSelection([]);
            }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              compareMode
                ? "bg-accent-purple text-white"
                : "bg-surface-base border border-surface-border text-zinc-400 hover:text-foreground"
            )}
          >
            {compareMode
              ? `Comparando (${compareSelection.length}/3)`
              : "Modo comparar"}
          </button>
        </div>

        {/* Comparison bar */}
        {compareMode && compareSelection.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-zinc-500">Seleccionadas:</span>
            {compareSelection.map((id) => {
              const voice = voices.find((v) => v.voice_id === id);
              if (!voice) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-2 py-1 bg-accent-purple/20 rounded-full text-sm text-accent-purple"
                >
                  <span>{voice.name}</span>
                  <button
                    onClick={() => toggleCompare(id)}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {compareSelection.length > 1 && (
              <button
                onClick={startComparison}
                className="px-3 py-1 text-sm bg-accent-purple text-white rounded-full hover:bg-accent-purple/90"
              >
                Comparar voces
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voice grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-zinc-500">Cargando voces...</div>
          </div>
        ) : filteredVoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mic className="h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-500">
              No se encontraron voces con estos filtros
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.voice_id}
                voice={voice}
                isSelected={selectedVoiceId === voice.voice_id}
                isPlaying={playingId === voice.voice_id}
                isInCompare={compareSelection.includes(voice.voice_id)}
                compareMode={compareMode}
                onPlay={() => playPreview(voice)}
                onSelect={() => onSelect?.(voice.voice_id)}
                onToggleCompare={() => toggleCompare(voice.voice_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="shrink-0 px-4 py-2 border-t border-surface-border bg-surface-base text-xs text-zinc-500">
        {filteredVoices.length} de {voices.length} voces
      </div>
    </div>
  );
}

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  isPlaying: boolean;
  isInCompare: boolean;
  compareMode: boolean;
  onPlay: () => void;
  onSelect: () => void;
  onToggleCompare: () => void;
}

function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  isInCompare,
  compareMode,
  onPlay,
  onSelect,
  onToggleCompare,
}: VoiceCardProps) {
  const labels = voice.labels || {};

  // Generate avatar bg color based on voice name
  const avatarColor = getAvatarColor(voice.name);

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl transition-all",
        "bg-surface-elevated border-2",
        isSelected
          ? "border-accent-purple shadow-glow-purple-sm"
          : isInCompare
          ? "border-yellow-500"
          : "border-surface-border hover:border-accent-purple/30"
      )}
    >
      {/* Recommended badge */}
      {voice.isRecommended && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-500 text-black text-xs font-medium rounded-full flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          Recomendada
        </div>
      )}

      {/* Compare checkbox */}
      {compareMode && (
        <button
          onClick={onToggleCompare}
          className={cn(
            "absolute top-3 left-3 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center",
            isInCompare
              ? "bg-yellow-500 border-yellow-500 text-black"
              : "border-zinc-600 hover:border-yellow-500"
          )}
        >
          {isInCompare && <Check className="h-3 w-3" />}
        </button>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
            avatarColor
          )}
        >
          <span className="text-xl font-bold text-white">
            {voice.name.charAt(0)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{voice.name}</h3>

          {/* Labels */}
          <div className="flex flex-wrap gap-1 mt-1">
            {labels.gender && (
              <span className="px-1.5 py-0.5 text-xs bg-surface-base rounded text-zinc-400">
                {labels.gender}
              </span>
            )}
            {labels.accent && (
              <span className="px-1.5 py-0.5 text-xs bg-surface-base rounded text-zinc-400">
                {labels.accent}
              </span>
            )}
            {labels.age && (
              <span className="px-1.5 py-0.5 text-xs bg-surface-base rounded text-zinc-400">
                {labels.age}
              </span>
            )}
          </div>

          {/* Style tags */}
          {voice.style && voice.style.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {voice.style.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 text-xs bg-accent-purple/20 text-accent-purple rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Podcast score */}
          {voice.podcastScore && voice.podcastScore >= 6 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <Volume2 className="h-3 w-3" />
              Podcast score: {voice.podcastScore}/10
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {/* Play preview */}
        <button
          onClick={onPlay}
          disabled={!voice.preview_url}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors",
            isPlaying
              ? "bg-accent-purple text-white"
              : "bg-surface-base text-zinc-400 hover:text-foreground",
            !voice.preview_url && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="text-sm">{isPlaying ? "Pausar" : "Escuchar"}</span>
        </button>

        {/* Select button */}
        {!compareMode && (
          <button
            onClick={onSelect}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-colors",
              isSelected
                ? "bg-accent-purple text-white"
                : "bg-surface-base text-zinc-400 hover:text-foreground hover:bg-surface-overlay"
            )}
          >
            {isSelected ? "Seleccionada" : "Usar"}
          </button>
        )}
      </div>
    </div>
  );
}

// Generate consistent color for avatar based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-gradient-to-br from-purple-500 to-pink-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-emerald-500",
    "bg-gradient-to-br from-orange-500 to-red-500",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
    "bg-gradient-to-br from-teal-500 to-cyan-500",
    "bg-gradient-to-br from-indigo-500 to-purple-500",
    "bg-gradient-to-br from-rose-500 to-pink-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
