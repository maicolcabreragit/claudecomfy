"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Radio,
  Sparkles,
  Volume2,
  Download,
  Play,
  Pause,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  VoiceSelector,
  VoiceSettingsControl,
  AudioPreview,
  CreditEstimator,
  DEFAULT_VOICE_SETTINGS,
  type Voice,
  type VoiceSettings,
} from "../components";

interface Trend {
  id: string;
  title: string;
  description: string;
  category: string;
  heatScore: number;
  createdAt: string;
}

type WizardStep = "select" | "script" | "voice" | "generate";

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: "select", label: "Seleccionar Trends", icon: Radio },
  { id: "script", label: "Generar Script", icon: Sparkles },
  { id: "voice", label: "Configurar Voz", icon: Volume2 },
  { id: "generate", label: "Generar Audio", icon: Download },
];

export default function NewEpisodePage() {
  const router = useRouter();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("select");
  
  // Step 1: Trends
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  
  // Step 2: Script
  const [script, setScript] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  
  // Step 3: Voice
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState<number | undefined>(undefined);
  
  // Step 4: Generate
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load trends
  useEffect(() => {
    const loadTrends = async () => {
      try {
        const res = await fetch("/api/trends?limit=20");
        const data = await res.json();
        
        if (data.success || data.trends) {
          // Filter out trends already used in episodes
          setTrends(data.trends || []);
        }
      } catch (error) {
        console.error("Failed to load trends:", error);
      } finally {
        setTrendsLoading(false);
      }
    };

    loadTrends();
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const res = await fetch("/api/elevenlabs/voices");
        const data = await res.json();
        
        if (data.success) {
          setVoices(data.voices);
          // Set default voice
          const recommended = data.voices.find((v: Voice) => v.isRecommended);
          if (recommended) {
            setSelectedVoice(recommended.voice_id);
          } else if (data.voices.length > 0) {
            setSelectedVoice(data.voices[0].voice_id);
          }
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

  // Toggle trend selection
  const toggleTrend = (trendId: string) => {
    if (selectedTrends.includes(trendId)) {
      setSelectedTrends(selectedTrends.filter(id => id !== trendId));
    } else if (selectedTrends.length < 5) {
      setSelectedTrends([...selectedTrends, trendId]);
    }
  };

  // Generate script
  const generateScript = async () => {
    if (selectedTrends.length === 0) return;

    setIsGeneratingScript(true);
    setScriptError(null);

    try {
      const res = await fetch("/api/podcast/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendIds: selectedTrends,
          saveAsDraft: true,
          voiceId: selectedVoice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setScript(data.script);
        setScriptTitle(data.title);
        setEpisodeId(data.episodeId);
      } else {
        setScriptError(data.error || "Error al generar el script");
      }
    } catch (error) {
      console.error("Script generation error:", error);
      setScriptError("Error de conexión");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate voice preview
  const generatePreview = async () => {
    if (!script || !selectedVoice) return;

    setPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/elevenlabs/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script.slice(0, 500),
          voiceId: selectedVoice,
          settings: voiceSettings,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewUrl(data.audio);
      }
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Generate full audio
  const generateFullAudio = async () => {
    if (!episodeId) return;

    setIsGenerating(true);
    setGenerateError(null);
    setGenerateProgress(10);

    try {
      // Update episode with voice settings first
      await fetch(`/api/podcast/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          voiceId: selectedVoice,
          voiceSettings,
        }),
      });

      setGenerateProgress(30);

      // Generate audio
      const res = await fetch(`/api/podcast/${episodeId}/generate`, {
        method: "POST",
      });

      setGenerateProgress(80);

      const data = await res.json();

      if (data.success) {
        setGeneratedAudioUrl(data.episode.audioUrl);
        setGenerateProgress(100);
      } else {
        setGenerateError(data.error || "Error al generar el audio");
      }
    } catch (error) {
      console.error("Generate error:", error);
      setGenerateError("Error de conexión");
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case "select": return selectedTrends.length >= 1;
      case "script": return script.length > 0;
      case "voice": return selectedVoice !== "";
      case "generate": return true;
    }
  };

  const proceedToNext = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const goBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    } else {
      router.push("/podcast");
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-surface-border bg-surface-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Nuevo Episodio
                </h1>
                <p className="text-sm text-zinc-500">
                  Paso {currentStepIndex + 1} de {STEPS.length}
                </p>
              </div>
            </div>

            {generatedAudioUrl && (
              <Button
                variant="primary"
                onClick={() => router.push(`/podcast/editor/${episodeId}`)}
              >
                Ver episodio
              </Button>
            )}
          </div>

          {/* Progress steps */}
          <div className="flex items-center mt-6">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted && "bg-green-500 text-white",
                      isActive && "bg-accent-purple text-white",
                      !isActive && !isCompleted && "bg-surface-base text-zinc-500"
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm hidden md:block",
                      isActive ? "text-foreground font-medium" : "text-zinc-500"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4",
                      isCompleted ? "bg-green-500" : "bg-surface-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Step 1: Select Trends */}
          {currentStep === "select" && (
            <StepSelectTrends
              trends={trends}
              selectedTrends={selectedTrends}
              onToggle={toggleTrend}
              isLoading={trendsLoading}
            />
          )}

          {/* Step 2: Generate Script */}
          {currentStep === "script" && (
            <StepGenerateScript
              script={script}
              onScriptChange={setScript}
              isGenerating={isGeneratingScript}
              error={scriptError}
              onGenerate={generateScript}
              selectedTrends={trends.filter(t => selectedTrends.includes(t.id))}
            />
          )}

          {/* Step 3: Configure Voice */}
          {currentStep === "voice" && (
            <StepConfigureVoice
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              voiceSettings={voiceSettings}
              onSettingsChange={setVoiceSettings}
              previewUrl={previewUrl}
              previewLoading={previewLoading}
              onGeneratePreview={generatePreview}
              script={script}
              remainingCredits={remainingCredits}
              isLoading={voicesLoading}
            />
          )}

          {/* Step 4: Generate Audio */}
          {currentStep === "generate" && (
            <StepGenerateAudio
              isGenerating={isGenerating}
              progress={generateProgress}
              audioUrl={generatedAudioUrl}
              error={generateError}
              onGenerate={generateFullAudio}
              episodeId={episodeId}
              script={script}
              remainingCredits={remainingCredits}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-surface-border bg-surface-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button variant="outline" onClick={goBack}>
            {currentStepIndex === 0 ? "Cancelar" : "Anterior"}
          </Button>

          {currentStep !== "generate" ? (
            <Button
              variant="primary"
              onClick={proceedToNext}
              disabled={!canProceed()}
              rightIcon={ArrowRight}
            >
              Siguiente
            </Button>
          ) : !generatedAudioUrl ? (
            <Button
              variant="primary"
              onClick={generateFullAudio}
              disabled={isGenerating}
              isLoading={isGenerating}
              leftIcon={Sparkles}
            >
              Generar Episodio
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => router.push("/podcast")}
            >
              Ir al Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Select Trends
interface StepSelectTrendsProps {
  trends: Trend[];
  selectedTrends: string[];
  onToggle: (id: string) => void;
  isLoading: boolean;
}

function StepSelectTrends({ trends, selectedTrends, onToggle, isLoading }: StepSelectTrendsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Selecciona las tendencias para el episodio
      </h2>
      <p className="text-zinc-500 mb-6">
        Elige entre 1 y 5 tendencias para crear tu podcast
      </p>

      <div className="space-y-3">
        {trends.map((trend) => {
          const isSelected = selectedTrends.includes(trend.id);

          return (
            <div
              key={trend.id}
              onClick={() => onToggle(trend.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all",
                "border-2",
                isSelected
                  ? "border-accent-purple bg-accent-purple/5"
                  : "border-surface-border bg-surface-elevated hover:border-accent-purple/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                isSelected
                  ? "border-accent-purple bg-accent-purple"
                  : "border-zinc-600"
              )}>
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground">{trend.title}</h3>
                  <span className="px-2 py-0.5 text-xs bg-surface-base rounded text-zinc-400">
                    {trend.category}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2">
                  {trend.description}
                </p>
              </div>

              <div className="text-xs text-zinc-500 shrink-0">
                🔥 {trend.heatScore}
              </div>
            </div>
          );
        })}
      </div>

      {trends.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No hay tendencias disponibles. Sincroniza nuevas tendencias primero.
        </div>
      )}

      <div className="mt-4 text-sm text-zinc-500">
        {selectedTrends.length} de 5 seleccionadas
      </div>
    </div>
  );
}

// Step 2: Generate Script
interface StepGenerateScriptProps {
  script: string;
  onScriptChange: (script: string) => void;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  selectedTrends: Trend[];
}

function StepGenerateScript({
  script,
  onScriptChange,
  isGenerating,
  error,
  onGenerate,
  selectedTrends,
}: StepGenerateScriptProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Genera el script del episodio
      </h2>
      <p className="text-zinc-500 mb-6">
        La IA creará un script basado en las {selectedTrends.length} tendencias seleccionadas
      </p>

      {/* Selected trends preview */}
      <div className="mb-6 p-4 rounded-lg bg-surface-elevated border border-surface-border">
        <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
          Tendencias incluidas
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTrends.map((trend) => (
            <span
              key={trend.id}
              className="px-2 py-1 text-sm bg-accent-purple/20 text-accent-purple rounded"
            >
              {trend.title}
            </span>
          ))}
        </div>
      </div>

      {!script ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">
            Genera un script optimizado para podcast con Claude AI
          </p>
          <Button
            variant="primary"
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            leftIcon={Sparkles}
          >
            {isGenerating ? "Generando script..." : "Generar Script con IA"}
          </Button>
          {error && (
            <p className="mt-4 text-sm text-semantic-error">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-400">Script generado</span>
            <Button variant="ghost" size="sm" onClick={onGenerate} disabled={isGenerating}>
              Regenerar
            </Button>
          </div>
          <textarea
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            className={cn(
              "w-full h-96 px-4 py-3 rounded-lg resize-none",
              "bg-surface-elevated border border-surface-border",
              "text-foreground font-mono text-sm",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
            )}
          />
          <div className="mt-2 text-xs text-zinc-500">
            {script.split(/\s+/).length} palabras • ~{Math.round(script.split(/\s+/).length / 150)} min
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3: Configure Voice
interface StepConfigureVoiceProps {
  voices: Voice[];
  selectedVoice: string;
  onVoiceChange: (id: string) => void;
  voiceSettings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  previewUrl: string | null;
  previewLoading: boolean;
  onGeneratePreview: () => void;
  script: string;
  remainingCredits?: number;
  isLoading: boolean;
}

function StepConfigureVoice({
  voices,
  selectedVoice,
  onVoiceChange,
  voiceSettings,
  onSettingsChange,
  previewUrl,
  previewLoading,
  onGeneratePreview,
  script,
  remainingCredits,
  isLoading,
}: StepConfigureVoiceProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Configura la voz del podcast
      </h2>
      <p className="text-zinc-500 mb-6">
        Elige una voz y ajusta los parámetros
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Voz
            </label>
            <VoiceSelector
              value={selectedVoice}
              onChange={(id) => {
                onVoiceChange(id);
                // Clear preview when voice changes
              }}
              voices={voices}
              isLoading={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Ajustes de voz
            </label>
            <VoiceSettingsControl
              value={voiceSettings}
              onChange={onSettingsChange}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Preview de audio
            </label>
            <AudioPreview
              audioUrl={previewUrl}
              isLoading={previewLoading}
              onGenerate={onGeneratePreview}
            />
          </div>

          <CreditEstimator
            text={script}
            remainingCredits={remainingCredits}
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Generate Audio
interface StepGenerateAudioProps {
  isGenerating: boolean;
  progress: number;
  audioUrl: string | null;
  error: string | null;
  onGenerate: () => void;
  episodeId: string | null;
  script: string;
  remainingCredits?: number;
}

function StepGenerateAudio({
  isGenerating,
  progress,
  audioUrl,
  error,
  onGenerate,
  episodeId,
  script,
  remainingCredits,
}: StepGenerateAudioProps) {
  const estimatedCredits = Math.ceil(script.length / 30);

  if (audioUrl) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          ¡Episodio generado!
        </h2>
        <p className="text-zinc-500 mb-6">
          Tu podcast está listo para descargar
        </p>

        <audio controls className="mx-auto mb-6" src={audioUrl}>
          Tu navegador no soporta audio
        </audio>

        <div className="flex items-center justify-center gap-4">
          <a
            href={`/api/podcast/${episodeId}/download`}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-lg",
              "bg-accent-purple text-white",
              "hover:bg-accent-purple/90 transition-colors"
            )}
          >
            <Download className="h-5 w-5" />
            Descargar MP3
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Radio className="h-16 w-16 text-accent-purple mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Generar episodio completo
      </h2>
      <p className="text-zinc-500 mb-6">
        Esto consumirá aproximadamente <strong>{estimatedCredits.toLocaleString()}</strong> créditos
      </p>

      {remainingCredits !== undefined && (
        <p className="text-sm text-zinc-400 mb-6">
          Créditos disponibles: {remainingCredits.toLocaleString()}
        </p>
      )}

      {isGenerating ? (
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 text-accent-purple animate-spin" />
            <span className="text-sm text-zinc-400">
              Generando audio... esto puede tomar unos minutos
            </span>
          </div>
          <div className="h-2 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-purple transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">{progress}%</p>
        </div>
      ) : (
        <>
          <Button
            variant="primary"
            size="lg"
            onClick={onGenerate}
            leftIcon={Sparkles}
          >
            Generar Episodio
          </Button>
          {error && (
            <p className="mt-4 text-sm text-semantic-error">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
