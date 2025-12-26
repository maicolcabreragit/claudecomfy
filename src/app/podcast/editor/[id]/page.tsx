"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Play, 
  Download,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  ScriptEditor,
  VoiceSelector,
  VoiceSettingsControl,
  AudioPreview,
  CreditEstimator,
  DEFAULT_VOICE_SETTINGS,
  type Voice,
  type VoiceSettings,
  type PodcastEpisode,
} from "../../components";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function PodcastEditorPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;

  // Episode data
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>(undefined);
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  // Load episode data
  useEffect(() => {
    if (!episodeId) return;

    const loadEpisode = async () => {
      try {
        const res = await fetch(`/api/podcast/${episodeId}`);
        const data = await res.json();
        
        if (data.success && data.episode) {
          setEpisode(data.episode);
          setScript(data.episode.script || "");
          setVoiceId(data.episode.voiceId);
          if (data.episode.voiceSettings) {
            setVoiceSettings(data.episode.voiceSettings);
          }
        } else {
          console.error("Episode not found");
          router.push("/podcast");
        }
      } catch (error) {
        console.error("Failed to load episode:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisode();
  }, [episodeId, router]);

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

  // Auto-save functionality
  useEffect(() => {
    if (hasChangesRef.current) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        saveEpisode();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [script, voiceId, voiceSettings]);

  // Mark changes
  const handleScriptChange = (newScript: string) => {
    setScript(newScript);
    hasChangesRef.current = true;
    setSaveStatus("idle");
  };

  const handleVoiceChange = (newVoiceId: string) => {
    setVoiceId(newVoiceId);
    hasChangesRef.current = true;
    setSaveStatus("idle");
    setPreviewUrl(null); // Clear preview when voice changes
  };

  const handleSettingsChange = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    hasChangesRef.current = true;
    setSaveStatus("idle");
  };

  // Save episode
  const saveEpisode = useCallback(async () => {
    if (!episodeId) return;
    
    setSaveStatus("saving");
    
    try {
      const res = await fetch(`/api/podcast/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          voiceId,
          voiceSettings,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSaveStatus("saved");
        hasChangesRef.current = false;
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus("error");
    }
  }, [episodeId, script, voiceId, voiceSettings]);

  // Generate preview
  const generatePreview = async () => {
    const textToPreview = selectedText || script.slice(0, 500);
    if (!textToPreview.trim()) return;

    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/elevenlabs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToPreview,
          voiceId,
          settings: voiceSettings,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewUrl(data.audio);
      } else {
        console.error("Preview generation failed:", data.error);
      }
    } catch (error) {
      console.error("Preview generation error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Generate full episode
  const generateEpisode = async () => {
    if (!episodeId) return;

    // Confirm with user
    const estimatedCredits = Math.ceil(script.length / 30);
    const confirmed = window.confirm(
      `¿Generar el episodio completo?\n\nEsto consumirá aproximadamente ${estimatedCredits.toLocaleString()} créditos.`
    );
    
    if (!confirmed) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Save first
      await saveEpisode();

      // Generate audio
      const res = await fetch(`/api/podcast/${episodeId}/generate`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        // Reload episode to get new audio URL
        const episodeRes = await fetch(`/api/podcast/${episodeId}`);
        const episodeData = await episodeRes.json();
        if (episodeData.success) {
          setEpisode(episodeData.episode);
        }
      } else {
        setGenerationError(data.error || "Error al generar el audio");
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationError("Error de conexión al generar el audio");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle selection change for preview
  const handleSelectionChange = (selection: { text: string } | null) => {
    setSelectedText(selection?.text || null);
  };

  // Download audio
  const downloadAudio = () => {
    if (!episodeId) return;
    window.open(`/api/podcast/${episodeId}/download`, "_blank");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S = Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEpisode();
      }
      // Cmd/Ctrl + P = Preview
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        generatePreview();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveEpisode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <div className="text-zinc-500">Episodio no encontrado</div>
      </div>
    );
  }

  const isReady = episode.status === "READY" || episode.status === "PUBLISHED";

  return (
    <div className="flex flex-col h-screen bg-surface-base">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-elevated">
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
              {episode.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Episodio #{episode.episodeNumber}</span>
              <span>•</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs",
                episode.status === "DRAFT" && "bg-zinc-700 text-zinc-300",
                episode.status === "GENERATING" && "bg-yellow-500/20 text-yellow-400",
                episode.status === "READY" && "bg-green-500/20 text-green-400",
                episode.status === "PUBLISHED" && "bg-accent-purple/20 text-accent-purple",
                episode.status === "FAILED" && "bg-semantic-error/20 text-semantic-error",
              )}>
                {episode.status}
              </span>
            </div>
          </div>
        </div>

        {/* Save status indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Check className="h-3 w-3" />
              Guardado
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-semantic-error">
              <AlertCircle className="h-3 w-3" />
              Error al guardar
            </span>
          )}
        </div>
      </div>

      {/* Main content - Two columns */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Script Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-surface-border">
          <ScriptEditor
            value={script}
            onChange={handleScriptChange}
            onSelectionChange={handleSelectionChange}
            disabled={isGenerating}
            className="flex-1"
          />
        </div>

        {/* Right: Voice & Preview Panel */}
        <div className="w-80 shrink-0 flex flex-col overflow-y-auto bg-surface-base">
          <div className="p-4 space-y-6">
            {/* Voice selector */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Voz
              </h3>
              <VoiceSelector
                value={voiceId}
                onChange={handleVoiceChange}
                voices={voices}
                isLoading={voicesLoading}
              />
            </div>

            {/* Voice settings */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Configuración de Voz
              </h3>
              <VoiceSettingsControl
                value={voiceSettings}
                onChange={handleSettingsChange}
                disabled={isGenerating}
              />
            </div>

            {/* Preview section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">
                  Preview
                </h3>
                {selectedText && (
                  <span className="text-xs text-zinc-500">
                    {selectedText.length} chars seleccionados
                  </span>
                )}
              </div>
              <AudioPreview
                audioUrl={previewUrl}
                isLoading={previewLoading}
                onGenerate={generatePreview}
              />
            </div>

            {/* Credit estimator */}
            <CreditEstimator
              text={script}
              remainingCredits={remainingCredits}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-surface-border bg-surface-elevated">
        <div className="flex items-center gap-2">
          {generationError && (
            <div className="flex items-center gap-2 text-sm text-semantic-error">
              <AlertCircle className="h-4 w-4" />
              {generationError}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={saveEpisode}
            disabled={isGenerating}
            leftIcon={Save}
          >
            Guardar borrador
          </Button>

          {isReady ? (
            <Button
              variant="primary"
              onClick={downloadAudio}
              leftIcon={Download}
            >
              Descargar MP3
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={generateEpisode}
              disabled={isGenerating || !script.trim()}
              isLoading={isGenerating}
              leftIcon={Sparkles}
            >
              Generar Episodio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
