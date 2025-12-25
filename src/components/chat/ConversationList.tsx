"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationPreview {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface ConversationListProps {
  projectId: string | null;
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
}

/**
 * ConversationList - Lista de conversaciones en el sidebar
 * 
 * Muestra las conversaciones del usuario, filtradas por proyecto si aplica.
 */
export function ConversationList({
  projectId,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = projectId
        ? `/api/conversations?projectId=${projectId}`
        : "/api/conversations";
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);

    try {
      await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Conversaciones
        </span>
        <button
          onClick={onNewConversation}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
          title="Nueva conversación"
        >
          <Plus className="h-4 w-4 text-purple-400" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-500">No hay conversaciones</p>
            <button
              onClick={onNewConversation}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300"
            >
              Crear una nueva
            </button>
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelectConversation(conv.id)}
                role="button"
                tabIndex={0}
                className={cn(
                  "w-full px-3 py-2 text-left flex items-center gap-2 group hover:bg-zinc-800/50 transition-colors cursor-pointer",
                  selectedConversationId === conv.id && "bg-purple-500/20"
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 text-zinc-600 transition-transform",
                    selectedConversationId === conv.id && "rotate-90 text-purple-400"
                  )}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {conv.title || "Sin título"}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {conv._count?.messages ?? 0} mensajes · {formatDate(conv.updatedAt)}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  disabled={deletingId === conv.id}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  {deletingId === conv.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                  ) : (
                    <Trash2 className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
