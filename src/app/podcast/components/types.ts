/**
 * Podcast Editor Types
 */

import { PodcastStatus } from "@prisma/client";

export interface PodcastEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  script: string;
  audioUrl: string | null;
  audioDuration: number | null;
  audioSize: number | null;
  voiceId: string;
  voiceSettings: VoiceSettings | null;
  status: PodcastStatus;
  publishedPlatforms: string[];
  publishedAt: Date | null;
  trendIds: string[];
  creditsUsed: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: {
    accent?: string;
    age?: string;
    gender?: string;
    description?: string;
  };
  preview_url?: string;
  podcastScore?: number;
  isRecommended?: boolean;
}

export interface ScriptSection {
  type: "intro" | "hook" | "content" | "value" | "outro";
  label: string;
  startIndex: number;
  endIndex: number;
  content: string;
}

export const SECTION_LABELS: Record<ScriptSection["type"], string> = {
  intro: "🎙️ Intro",
  hook: "🪝 Hook",
  content: "📰 Contenido",
  value: "💡 Valor",
  outro: "👋 Cierre",
};

export const PAUSE_OPTIONS = [
  { label: "Pausa corta", value: '<break time="0.5s"/>', icon: "⏸" },
  { label: "Pausa media", value: '<break time="1s"/>', icon: "⏸⏸" },
  { label: "Pausa larga", value: '<break time="1.5s"/>', icon: "⏸⏸⏸" },
  { label: "Pausa sección", value: '<break time="2s"/>', icon: "⏹" },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
};
