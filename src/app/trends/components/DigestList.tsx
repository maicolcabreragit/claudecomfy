"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Calendar, 
  Headphones, 
  MessageSquare, 
  Eye,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Digest {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  audioUrl: string | null;
}

interface DigestListProps {
  onSelectDigest: (digestId: string) => void;
  onSendToChat?: (digestId: string, summary: string) => void;
}

/**
 * DigestList - Display previous analysis/digests
 */
export function DigestList({ onSelectDigest, onSendToChat }: DigestListProps) {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDigests();
  }, []);

  async function fetchDigests() {
    try {
      const res = await fetch("/api/trends/learn");
      const data = await res.json();
      
      if (data.success) {
        setDigests(data.digests || []);
      } else {
        setError(data.error || "Error al cargar análisis");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const truncateSummary = (summary: string, maxLen = 150) => {
    if (summary.length <= maxLen) return summary;
    return summary.slice(0, maxLen).trim() + "...";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-semantic-error">{error}</p>
        <Button onClick={fetchDigests} variant="outline" className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-400 mb-2">No hay análisis guardados</h3>
        <p className="text-sm text-zinc-500">
          Genera un análisis desde la pestaña "Explorar Trends" para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {digests.map((digest) => (
        <article
          key={digest.id}
          className="bg-surface-base border border-surface-border rounded-lg p-4 hover:border-accent-purple/30 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{digest.title}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(digest.createdAt)}</span>
                {digest.audioUrl && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <Headphones className="h-3 w-3 text-accent-purple" />
                    <span className="text-accent-purple">Audio disponible</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
            {truncateSummary(digest.summary)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onSelectDigest(digest.id)}
              variant="primary"
              size="sm"
              leftIcon={Eye}
            >
              Ver completo
            </Button>
            
            {digest.audioUrl && (
              <Button
                onClick={() => window.open(digest.audioUrl!, "_blank")}
                variant="outline"
                size="sm"
                leftIcon={Headphones}
              >
                Escuchar
              </Button>
            )}
            
            {onSendToChat && (
              <Button
                onClick={() => onSendToChat(digest.id, digest.summary)}
                variant="ghost"
                size="sm"
                leftIcon={MessageSquare}
              >
                Al Chat
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
