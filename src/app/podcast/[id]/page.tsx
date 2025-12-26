"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Edit,
  Clock,
  Calendar,
  Coins,
  Radio,
  Loader2,
  Volume2,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  script: string;
  audioUrl: string | null;
  audioDuration: number | null;
  audioSize: number | null;
  voiceId: string;
  status: "DRAFT" | "GENERATING" | "READY" | "PUBLISHED" | "FAILED";
  publishedPlatforms: string[];
  trendIds: string[];
  creditsUsed: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Trend {
  id: string;
  title: string;
  category: string;
}

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;
  
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load episode
  useEffect(() => {
    const loadEpisode = async () => {
      try {
        const res = await fetch(`/api/podcast/${episodeId}`);
        const data = await res.json();
        
        if (data.success) {
          setEpisode(data.episode);
          setTrends(data.trends || []);
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

  // Audio controls
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
  }, [episode?.audioUrl]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "--";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusBadge = (status: Episode["status"]) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-zinc-700 text-zinc-300",
      GENERATING: "bg-yellow-500/20 text-yellow-400",
      READY: "bg-green-500/20 text-green-400",
      PUBLISHED: "bg-accent-purple/20 text-accent-purple",
      FAILED: "bg-semantic-error/20 text-semantic-error",
    };
    
    const labels: Record<string, string> = {
      DRAFT: "Borrador",
      GENERATING: "Generando",
      READY: "Listo",
      PUBLISHED: "Publicado",
      FAILED: "Error",
    };

    return (
      <span className={cn("px-3 py-1 text-sm rounded-full", styles[status])}>
        {labels[status]}
      </span>
    );
  };

  const deleteEpisode = async () => {
    if (!episode) return;
    if (!window.confirm(`¿Eliminar "${episode.title}"?`)) return;

    try {
      const res = await fetch(`/api/podcast/${episodeId}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        router.push("/podcast");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

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

  const hasAudio = episode.audioUrl && (episode.status === "READY" || episode.status === "PUBLISHED");
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-surface-border bg-surface-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/podcast")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-foreground">
                    {episode.title}
                  </h1>
                  {getStatusBadge(episode.status)}
                </div>
                <p className="text-sm text-zinc-500">
                  Episodio #{episode.episodeNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/podcast/editor/${episodeId}`)}
                leftIcon={Edit}
              >
                Editar
              </Button>
              {hasAudio && (
                <a href={`/api/podcast/${episodeId}/download`}>
                  <Button variant="primary" leftIcon={Download}>
                    Descargar
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Audio Player */}
        {hasAudio && (
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <audio ref={audioRef} src={episode.audioUrl!} preload="metadata" />
            
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  "bg-orange-500 text-white",
                  "hover:bg-orange-600 transition-colors"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none cursor-pointer",
                    "bg-white/20",
                    "[&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                    "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full",
                    "[&::-webkit-slider-thumb]:cursor-pointer"
                  )}
                  style={{
                    background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                  }}
                />
                <div className="flex justify-between mt-1 text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetadataCard
            icon={Clock}
            label="Duración"
            value={formatTime(episode.audioDuration || 0)}
          />
          <MetadataCard
            icon={Calendar}
            label="Creado"
            value={new Date(episode.createdAt).toLocaleDateString("es-ES")}
          />
          <MetadataCard
            icon={Coins}
            label="Créditos"
            value={episode.creditsUsed?.toLocaleString() || "--"}
          />
          <MetadataCard
            icon={Volume2}
            label="Tamaño"
            value={formatFileSize(episode.audioSize)}
          />
        </div>

        {/* Trends used */}
        {trends.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-400 mb-3">
              Tendencias incluidas
            </h2>
            <div className="flex flex-wrap gap-2">
              {trends.map((trend) => (
                <span
                  key={trend.id}
                  className="px-3 py-1.5 text-sm bg-surface-elevated border border-surface-border rounded-lg text-foreground"
                >
                  {trend.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Script */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Script del episodio
            </h2>
            <span className="text-xs text-zinc-500">
              {episode.script.split(/\s+/).length} palabras
            </span>
          </div>
          <div className={cn(
            "p-4 rounded-lg max-h-96 overflow-y-auto",
            "bg-surface-elevated border border-surface-border",
            "font-mono text-sm text-zinc-300 whitespace-pre-wrap"
          )}>
            {episode.script}
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>Creado: {formatDate(episode.createdAt)}</p>
          <p>Actualizado: {formatDate(episode.updatedAt)}</p>
        </div>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-surface-border">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Zona peligrosa</h3>
          <Button
            variant="destructive"
            onClick={deleteEpisode}
            leftIcon={Trash2}
          >
            Eliminar episodio
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MetadataCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function MetadataCard({ icon: Icon, label, value }: MetadataCardProps) {
  return (
    <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
