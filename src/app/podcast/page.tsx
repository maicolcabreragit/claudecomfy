"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Radio,
  Loader2,
  Play,
  Download,
  Edit,
  Trash2,
  Clock,
  FileText,
  Coins,
  Settings,
  RefreshCw,
  Package,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  status: "DRAFT" | "GENERATING" | "READY" | "PUBLISHED" | "FAILED";
  createdAt: string;
}

interface Stats {
  total: number;
  drafts: number;
  ready: number;
  published: number;
}

type StatusFilter = "all" | "DRAFT" | "GENERATING" | "READY" | "PUBLISHED" | "FAILED";

export default function PodcastDashboard() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, drafts: 0, ready: 0, published: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  
  // Selection mode for batch operations
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

  // Load episodes
  const loadEpisodes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      
      const res = await fetch(`/api/podcast?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setEpisodes(data.episodes);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load episodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load credits
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

  useEffect(() => {
    loadEpisodes();
    loadCredits();
  }, [statusFilter]);

  // Delete episode
  const deleteEpisode = async (id: string, title: string) => {
    if (!window.confirm(`¿Eliminar "${title}"?`)) return;

    try {
      const res = await fetch(`/api/podcast/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        loadEpisodes();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all ready episodes
  const selectAllReady = () => {
    const readyIds = episodes
      .filter(e => e.status === "READY" || e.status === "PUBLISHED")
      .map(e => e.id);
    setSelectedIds(new Set(readyIds));
  };

  // Batch download
  const batchDownload = async () => {
    if (selectedIds.size === 0) return;

    setIsBatchDownloading(true);
    try {
      const res = await fetch("/api/podcast/batch-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeIds: Array.from(selectedIds),
          includeMetadataCsv: true,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `podcast-episodes-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Exit selection mode
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Batch download failed:", error);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Episode["status"]) => {
    switch (status) {
      case "DRAFT": return "bg-zinc-700 text-zinc-300";
      case "GENERATING": return "bg-yellow-500/20 text-yellow-400";
      case "READY": return "bg-green-500/20 text-green-400";
      case "PUBLISHED": return "bg-accent-purple/20 text-accent-purple";
      case "FAILED": return "bg-semantic-error/20 text-semantic-error";
    }
  };

  const getStatusLabel = (status: Episode["status"]) => {
    switch (status) {
      case "DRAFT": return "Borrador";
      case "GENERATING": return "Generando";
      case "READY": return "Listo";
      case "PUBLISHED": return "Publicado";
      case "FAILED": return "Error";
    }
  };

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-surface-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Radio className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Podcast Studio
                </h1>
                <p className="text-sm text-zinc-500">
                  Genera podcasts profesionales con IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/podcast/settings")}
                leftIcon={Settings}
              >
                Configuración
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push("/podcast/new")}
                leftIcon={Plus}
              >
                Nuevo Episodio
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard
              label="Total"
              value={stats.total}
              icon={FileText}
            />
            <StatCard
              label="Borradores"
              value={stats.drafts}
              icon={Edit}
              color="text-zinc-400"
            />
            <StatCard
              label="Listos"
              value={stats.ready}
              icon={Play}
              color="text-green-400"
            />
            <StatCard
              label="Créditos"
              value={remainingCredits?.toLocaleString() || "..."}
              icon={Coins}
              color="text-yellow-400"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button
                  onClick={selectAllReady}
                  className="px-3 py-1 text-sm rounded-full bg-surface-elevated text-zinc-400 hover:text-foreground"
                >
                  Seleccionar listos
                </button>
                <span className="text-sm text-zinc-500">
                  {selectedIds.size} seleccionados
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-zinc-500">Filtrar:</span>
                {(["all", "DRAFT", "READY", "PUBLISHED"] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full transition-colors",
                      statusFilter === status
                        ? "bg-accent-purple text-white"
                        : "bg-surface-elevated text-zinc-400 hover:text-foreground"
                    )}
                  >
                    {status === "all" ? "Todos" : getStatusLabel(status)}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={batchDownload}
                  disabled={selectedIds.size === 0 || isBatchDownloading}
                  isLoading={isBatchDownloading}
                  leftIcon={Package}
                >
                  Descargar ZIP ({selectedIds.size})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  leftIcon={CheckSquare}
                >
                  Seleccionar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadEpisodes}
                  leftIcon={RefreshCw}
                >
                  Actualizar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Episode list */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay episodios
            </h3>
            <p className="text-zinc-500 mb-4">
              Empieza seleccionando tendencias para tu primer podcast
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/podcast/new")}
              leftIcon={Plus}
            >
              Crear primer episodio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                onEdit={() => router.push(`/podcast/editor/${episode.id}`)}
                onDelete={() => deleteEpisode(episode.id, episode.title)}
                formatDuration={formatDuration}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(episode.id)}
                onToggleSelect={() => toggleSelection(episode.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
}

function StatCard({ label, value, icon: Icon, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="p-4 rounded-lg bg-surface-base border border-surface-border">
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", color)} />
        <div>
          <div className={cn("text-2xl font-bold", color)}>
            {value}
          </div>
          <div className="text-xs text-zinc-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  onEdit: () => void;
  onDelete: () => void;
  formatDuration: (seconds: number | null) => string;
  formatDate: (date: string) => string;
  getStatusColor: (status: Episode["status"]) => string;
  getStatusLabel: (status: Episode["status"]) => string;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function EpisodeCard({
  episode,
  onEdit,
  onDelete,
  formatDuration,
  formatDate,
  getStatusColor,
  getStatusLabel,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: EpisodeCardProps) {
  const isReady = episode.status === "READY" || episode.status === "PUBLISHED";

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      window.location.href = `/podcast/${episode.id}`;
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg cursor-pointer",
      "bg-surface-elevated border-2",
      isSelected 
        ? "border-accent-purple bg-accent-purple/5" 
        : "border-surface-border hover:border-accent-purple/30",
      "transition-colors"
    )}
    onClick={handleClick}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="shrink-0">
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-accent-purple" />
          ) : (
            <Square className="h-5 w-5 text-zinc-500" />
          )}
        </div>
      )}

      {/* Episode number / thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold text-white">
          {episode.episodeNumber}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-foreground font-medium truncate">
            {episode.title}
          </h3>
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full shrink-0",
            getStatusColor(episode.status)
          )}>
            {getStatusLabel(episode.status)}
          </span>
        </div>
        
        {episode.description && (
          <p className="text-sm text-zinc-500 truncate mb-2">
            {episode.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(episode.audioDuration)}
          </span>
          <span>{formatDate(episode.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {isReady && episode.audioUrl && (
          <a
            href={`/api/podcast/${episode.id}/download`}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-zinc-400 hover:text-foreground hover:bg-surface-overlay"
            )}
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        
        <button
          onClick={onEdit}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "text-zinc-400 hover:text-foreground hover:bg-surface-overlay"
          )}
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </button>
        
        <button
          onClick={onDelete}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "text-zinc-400 hover:text-semantic-error hover:bg-semantic-error/10"
          )}
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
