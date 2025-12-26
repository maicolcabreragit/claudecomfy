"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Radio,
  Volume2,
  AlertCircle,
  Settings,
  ExternalLink,
  Clock,
  Coins,
  Tag,
  Mic,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  VoiceSelector,
  VoiceSettingsControl,
  AudioPreview,
  DEFAULT_VOICE_SETTINGS,
  type Voice,
  type VoiceSettings,
} from "../components";

interface PodcastConfig {
  id?: string;
  podcastName: string;
  podcastDescription: string | null;
  podcastDescriptionLong: string | null;
  coverArtUrl: string | null;
  category: string | null;
  keywords: string[];
  introScript: string | null;
  outroScript: string | null;
  defaultVoiceId: string | null;
  defaultVoiceSettings: VoiceSettings | null;
  contentTone: "formal" | "casual" | "energetic";
  characterPhrases: string[];
  targetDuration: number;
  publishFrequency: string | null;
  publishDay: string | null;
  publishTime: string | null;
  monthlyCreditsLimit: number | null;
  creditsAlertThreshold: number | null;
  spotifyShowId: string | null;
  spotifyShowUrl: string | null;
  ivooxShowId: string | null;
  ivooxShowUrl: string | null;
  applePodcastId: string | null;
  applePodcastUrl: string | null;
  youtubeChannelId: string | null;
  youtubeChannelUrl: string | null;
}

const DEFAULT_CONFIG: PodcastConfig = {
  podcastName: "IA Sin Filtros",
  podcastDescription: "Noticias de IA explicadas para que cualquiera las entienda",
  podcastDescriptionLong: null,
  coverArtUrl: null,
  category: "Technology",
  keywords: ["inteligencia artificial", "tecnología", "noticias IA", "machine learning"],
  introScript: null,
  outroScript: null,
  defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
  defaultVoiceSettings: DEFAULT_VOICE_SETTINGS,
  contentTone: "casual",
  characterPhrases: [],
  targetDuration: 420,
  publishFrequency: "weekly",
  publishDay: "monday",
  publishTime: "09:00",
  monthlyCreditsLimit: null,
  creditsAlertThreshold: 10000,
  spotifyShowId: null,
  spotifyShowUrl: null,
  ivooxShowId: null,
  ivooxShowUrl: null,
  applePodcastId: null,
  applePodcastUrl: null,
  youtubeChannelId: null,
  youtubeChannelUrl: null,
};

const CATEGORIES = [
  "Technology",
  "Business",
  "Education",
  "News",
  "Science",
  "Society & Culture",
  "Comedy",
  "Arts",
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
];

const DAY_OPTIONS = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Profesional, serio, informativo" },
  { value: "casual", label: "Casual", desc: "Conversacional, amigable, relajado" },
  { value: "energetic", label: "Energético", desc: "Dinámico, entusiasta, motivador" },
];

export default function PodcastSettingsPage() {
  const router = useRouter();
  
  const [config, setConfig] = useState<PodcastConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  
  const [introPreview, setIntroPreview] = useState<string | null>(null);
  const [outroPreview, setOutroPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<"intro" | "outro" | null>(null);
  
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  
  const [newPhrase, setNewPhrase] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  
  // Auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/podcast/config");
        const data = await res.json();
        
        if (data.success && data.config) {
          setConfig({
            ...DEFAULT_CONFIG,
            ...data.config,
            defaultVoiceSettings: data.config.defaultVoiceSettings || DEFAULT_VOICE_SETTINGS,
            keywords: data.config.keywords || [],
            characterPhrases: data.config.characterPhrases || [],
          });
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const res = await fetch("/api/elevenlabs/voices");
        const data = await res.json();
        if (data.success) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error("Failed to load voices:", error);
      } finally {
        setVoicesLoading(false);
      }
    };

    loadVoices();
  }, []);

  // Load credits
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const res = await fetch("/api/elevenlabs/credits");
        const data = await res.json();
        if (data.success) {
          setRemainingCredits(data.remaining);
        }
      } catch (error) {
        console.error("Failed to load credits:", error);
      }
    };

    loadCredits();
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (hasChanges) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveConfig();
      }, 3000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [config, hasChanges]);

  // Save config
  const saveConfig = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/podcast/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (data.success) {
        setSaveSuccess(true);
        setHasChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setError("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  // Generate preview
  const generatePreview = async (type: "intro" | "outro") => {
    const text = type === "intro" ? config.introScript : config.outroScript;
    if (!text?.trim() || !config.defaultVoiceId) return;

    setPreviewLoading(type);

    try {
      // Replace variables in text
      const processedText = text
        .replace(/\{NOMBRE_SHOW\}/g, config.podcastName)
        .replace(/\{NUMERO_EPISODIO\}/g, "1")
        .replace(/\{FECHA\}/g, new Date().toLocaleDateString("es-ES"));

      const res = await fetch("/api/elevenlabs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: processedText,
          voiceId: config.defaultVoiceId,
          settings: config.defaultVoiceSettings,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (type === "intro") {
          setIntroPreview(data.audio);
        } else {
          setOutroPreview(data.audio);
        }
      }
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setPreviewLoading(null);
    }
  };

  // Add phrase
  const addPhrase = () => {
    if (!newPhrase.trim()) return;
    updateConfig("characterPhrases", [...config.characterPhrases, newPhrase.trim()]);
    setNewPhrase("");
  };

  // Remove phrase
  const removePhrase = (index: number) => {
    updateConfig("characterPhrases", config.characterPhrases.filter((_, i) => i !== index));
  };

  // Add keyword
  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    updateConfig("keywords", [...config.keywords, newKeyword.trim().toLowerCase()]);
    setNewKeyword("");
  };

  // Remove keyword
  const removeKeyword = (index: number) => {
    updateConfig("keywords", config.keywords.filter((_, i) => i !== index));
  };

  const updateConfig = <K extends keyof PodcastConfig>(key: K, value: PodcastConfig[K]) => {
    setConfig({ ...config, [key]: value });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-surface-border bg-surface-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/podcast")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Configuración del Podcast
                </h1>
                <p className="text-sm text-zinc-500">
                  {hasChanges ? "Cambios sin guardar..." : "Guardado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Guardado
                </span>
              )}
              <Button
                variant="primary"
                onClick={saveConfig}
                isLoading={isSaving}
                leftIcon={Save}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-semantic-error/10 text-semantic-error">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Identity Section */}
        <Section title="Identidad del Show" icon={Radio}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Nombre del Podcast">
                <input
                  type="text"
                  value={config.podcastName}
                  onChange={(e) => updateConfig("podcastName", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-surface-base border border-surface-border",
                    "text-foreground placeholder:text-zinc-600",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  )}
                  placeholder="Ej: IA Sin Filtros"
                />
              </Field>

              <Field label="Descripción corta (para plataformas)">
                <textarea
                  value={config.podcastDescription || ""}
                  onChange={(e) => updateConfig("podcastDescription", e.target.value)}
                  rows={2}
                  maxLength={255}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg resize-none",
                    "bg-surface-base border border-surface-border",
                    "text-foreground placeholder:text-zinc-600",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  )}
                  placeholder="Breve descripción (max 255 chars)"
                />
                <div className="text-xs text-zinc-500 mt-1 text-right">
                  {(config.podcastDescription || "").length}/255
                </div>
              </Field>

              <Field label="Categoría principal">
                <select
                  value={config.category || "Technology"}
                  onChange={(e) => updateConfig("category", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-surface-base border border-surface-border",
                    "text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  )}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="Descripción larga (para web)">
                <textarea
                  value={config.podcastDescriptionLong || ""}
                  onChange={(e) => updateConfig("podcastDescriptionLong", e.target.value)}
                  rows={5}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg resize-none",
                    "bg-surface-base border border-surface-border",
                    "text-foreground placeholder:text-zinc-600",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  )}
                  placeholder="Descripción completa para tu web..."
                />
              </Field>

              <Field label="Cover Art URL">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.coverArtUrl || ""}
                    onChange={(e) => updateConfig("coverArtUrl", e.target.value)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg",
                      "bg-surface-base border border-surface-border",
                      "text-foreground placeholder:text-zinc-600",
                      "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    )}
                    placeholder="https://..."
                  />
                  {config.coverArtUrl && (
                    <div className="w-10 h-10 rounded-lg bg-surface-base border border-surface-border overflow-hidden">
                      <img src={config.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Recomendado: 2048x2048px, JPG o PNG
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* Keywords Section */}
        <Section title="Keywords / Tags" icon={Tag}>
          <p className="text-sm text-zinc-500 mb-4">
            Palabras clave para mejorar el descubrimiento en plataformas
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {config.keywords.map((keyword, index) => (
              <span
                key={index}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full text-sm",
                  "bg-accent-purple/20 text-accent-purple"
                )}
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(index)}
                  className="hover:text-white ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg",
                "bg-surface-base border border-surface-border",
                "text-foreground placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              )}
              placeholder="Añadir keyword..."
            />
            <Button onClick={addKeyword}>Añadir</Button>
          </div>
        </Section>

        {/* Voice Section */}
        <Section title="Voz y Estilo" icon={Volume2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Voz por defecto">
                <VoiceSelector
                  value={config.defaultVoiceId || ""}
                  onChange={(id) => updateConfig("defaultVoiceId", id)}
                  voices={voices}
                  isLoading={voicesLoading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/podcast/voices?returnTo=/podcast/settings")}
                  leftIcon={Mic}
                >
                  Ver catálogo completo
                </Button>
              </Field>

              <Field label="Tono del contenido">
                <div className="space-y-2">
                  {TONE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        "border-2",
                        config.contentTone === opt.value
                          ? "border-accent-purple bg-accent-purple/5"
                          : "border-surface-border hover:border-accent-purple/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="contentTone"
                        value={opt.value}
                        checked={config.contentTone === opt.value}
                        onChange={(e) => updateConfig("contentTone", e.target.value as PodcastConfig["contentTone"])}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        config.contentTone === opt.value
                          ? "border-accent-purple bg-accent-purple"
                          : "border-zinc-500"
                      )} />
                      <div>
                        <div className="text-sm font-medium text-foreground">{opt.label}</div>
                        <div className="text-xs text-zinc-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            <div>
              <Field label="Configuración de voz">
                <VoiceSettingsControl
                  value={config.defaultVoiceSettings || DEFAULT_VOICE_SETTINGS}
                  onChange={(settings) => updateConfig("defaultVoiceSettings", settings)}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Intro/Outro Section */}
        <Section title="Intro y Outro" icon={Mic}>
          <div className="mb-4 p-3 rounded-lg bg-surface-base border border-surface-border">
            <div className="text-xs text-zinc-500 mb-1">Variables disponibles:</div>
            <code className="text-xs text-accent-purple">
              {"{NOMBRE_SHOW}"} • {"{NUMERO_EPISODIO}"} • {"{FECHA}"}
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Script de Intro">
              <textarea
                value={config.introScript || ""}
                onChange={(e) => {
                  updateConfig("introScript", e.target.value);
                  setIntroPreview(null);
                }}
                rows={5}
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none font-mono text-sm",
                  "bg-surface-base border border-surface-border",
                  "text-foreground placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                )}
                placeholder="Hola, bienvenidos de vuelta a {NOMBRE_SHOW}..."
              />
              <div className="mt-2">
                <AudioPreview
                  audioUrl={introPreview}
                  isLoading={previewLoading === "intro"}
                  onGenerate={() => generatePreview("intro")}
                />
              </div>
            </Field>

            <Field label="Script de Outro">
              <textarea
                value={config.outroScript || ""}
                onChange={(e) => {
                  updateConfig("outroScript", e.target.value);
                  setOutroPreview(null);
                }}
                rows={5}
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none font-mono text-sm",
                  "bg-surface-base border border-surface-border",
                  "text-foreground placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                )}
                placeholder="Eso fue todo por hoy. Si te gustó..."
              />
              <div className="mt-2">
                <AudioPreview
                  audioUrl={outroPreview}
                  isLoading={previewLoading === "outro"}
                  onGenerate={() => generatePreview("outro")}
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* Character Phrases */}
        <Section title="Frases Características">
          <p className="text-sm text-zinc-500 mb-4">
            Muletillas y frases únicas de tu estilo que la IA usará en los scripts
          </p>
          
          <div className="space-y-2 mb-4">
            {config.characterPhrases.map((phrase, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
                  "bg-surface-base border border-surface-border"
                )}
              >
                <span className="text-sm text-foreground italic">"{phrase}"</span>
                <button
                  onClick={() => removePhrase(index)}
                  className="text-zinc-500 hover:text-semantic-error transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPhrase()}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg",
                "bg-surface-base border border-surface-border",
                "text-foreground placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
              )}
              placeholder='Ej: "Y eso tiene implicaciones ENORMES"'
            />
            <Button onClick={addPhrase}>Añadir</Button>
          </div>
        </Section>

        {/* Platform Links */}
        <Section title="Plataformas" icon={ExternalLink}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlatformField
              name="Spotify"
              color="bg-green-500"
              idValue={config.spotifyShowId || ""}
              urlValue={config.spotifyShowUrl || ""}
              onIdChange={(v) => updateConfig("spotifyShowId", v || null)}
              onUrlChange={(v) => updateConfig("spotifyShowUrl", v || null)}
            />
            <PlatformField
              name="iVoox"
              color="bg-orange-500"
              idValue={config.ivooxShowId || ""}
              urlValue={config.ivooxShowUrl || ""}
              onIdChange={(v) => updateConfig("ivooxShowId", v || null)}
              onUrlChange={(v) => updateConfig("ivooxShowUrl", v || null)}
            />
            <PlatformField
              name="Apple Podcasts"
              color="bg-purple-500"
              idValue={config.applePodcastId || ""}
              urlValue={config.applePodcastUrl || ""}
              onIdChange={(v) => updateConfig("applePodcastId", v || null)}
              onUrlChange={(v) => updateConfig("applePodcastUrl", v || null)}
            />
            <PlatformField
              name="YouTube"
              color="bg-red-500"
              idValue={config.youtubeChannelId || ""}
              urlValue={config.youtubeChannelUrl || ""}
              onIdChange={(v) => updateConfig("youtubeChannelId", v || null)}
              onUrlChange={(v) => updateConfig("youtubeChannelUrl", v || null)}
            />
          </div>
        </Section>

        {/* Advanced Section */}
        <Section title="Avanzado" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Duración objetivo por episodio">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={180}
                    max={1800}
                    step={60}
                    value={config.targetDuration}
                    onChange={(e) => updateConfig("targetDuration", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-foreground w-16 text-right">
                    {Math.round(config.targetDuration / 60)} min
                  </span>
                </div>
              </Field>

              <Field label="Frecuencia de publicación">
                <select
                  value={config.publishFrequency || "weekly"}
                  onChange={(e) => updateConfig("publishFrequency", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg",
                    "bg-surface-base border border-surface-border",
                    "text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  )}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Día de publicación">
                  <select
                    value={config.publishDay || "monday"}
                    onChange={(e) => updateConfig("publishDay", e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-surface-base border border-surface-border",
                      "text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    )}
                  >
                    {DAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Hora">
                  <input
                    type="time"
                    value={config.publishTime || "09:00"}
                    onChange={(e) => updateConfig("publishTime", e.target.value)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-surface-base border border-surface-border",
                      "text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    )}
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-base border border-surface-border">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-foreground">Créditos ElevenLabs</span>
                </div>
                
                <div className="text-2xl font-bold text-foreground mb-2">
                  {remainingCredits?.toLocaleString() || "..."} créditos
                </div>
                
                <div className="text-xs text-zinc-500">
                  ~{Math.floor((remainingCredits || 0) / 30000)} episodios de {Math.round(config.targetDuration / 60)} min restantes
                </div>
              </div>

              <Field label="Alerta cuando queden menos de">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.creditsAlertThreshold || 10000}
                    onChange={(e) => updateConfig("creditsAlertThreshold", parseInt(e.target.value))}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-surface-base border border-surface-border",
                      "text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    )}
                    min={1000}
                    step={1000}
                  />
                  <span className="text-sm text-zinc-500">créditos</span>
                </div>
              </Field>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="p-6 rounded-xl border border-surface-border bg-surface-elevated">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-6">
        {Icon && <Icon className="h-5 w-5 text-accent-purple" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

interface PlatformFieldProps {
  name: string;
  color: string;
  idValue: string;
  urlValue: string;
  onIdChange: (value: string) => void;
  onUrlChange: (value: string) => void;
}

function PlatformField({ name, color, idValue, urlValue, onIdChange, onUrlChange }: PlatformFieldProps) {
  return (
    <div className="p-4 rounded-lg bg-surface-base border border-surface-border">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-3 h-3 rounded-full", color)} />
        <span className="font-medium text-foreground">{name}</span>
      </div>
      <div className="space-y-2">
        <input
          type="text"
          value={idValue}
          onChange={(e) => onIdChange(e.target.value)}
          className={cn(
            "w-full px-3 py-1.5 rounded text-sm",
            "bg-surface-elevated border border-surface-border",
            "text-foreground placeholder:text-zinc-600",
            "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
          )}
          placeholder="Show ID"
        />
        <input
          type="text"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          className={cn(
            "w-full px-3 py-1.5 rounded text-sm",
            "bg-surface-elevated border border-surface-border",
            "text-foreground placeholder:text-zinc-600",
            "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
          )}
          placeholder="URL del show"
        />
      </div>
    </div>
  );
}
