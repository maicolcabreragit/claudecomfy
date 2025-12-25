"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Vault,
  Code,
  Lightbulb,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Snippet {
  id: string;
  trigger: string;
  content: string;
  type: "PROMPT" | "CODE" | "FIX";
  tags: string[];
  createdAt: string;
}

interface SnippetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  PROMPT: { icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  CODE: { icon: Code, color: "text-blue-400", bg: "bg-blue-500/20" },
  FIX: { icon: Wrench, color: "text-green-400", bg: "bg-green-500/20" },
};

export function SnippetManager({ isOpen, onClose }: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [trigger, setTrigger] = useState("/");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"PROMPT" | "CODE" | "FIX">("PROMPT");

  useEffect(() => {
    if (isOpen) {
      fetchSnippets();
    }
  }, [isOpen]);

  async function fetchSnippets() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/snippets");
      const data = await res.json();
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error("Failed to fetch snippets:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function createSnippet() {
    setError(null);

    if (!trigger.startsWith("/") || trigger.length < 2) {
      setError("Trigger must start with / and have at least 2 characters");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger, content: content.trim(), type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create snippet");
        return;
      }

      setSnippets((prev) => [data.snippet, ...prev]);
      setTrigger("/");
      setContent("");
      setType("PROMPT");
      setShowCreateForm(false);
    } catch {
      setError("Network error");
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteSnippet(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/snippets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSnippets((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete snippet:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Vault className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">La Bóveda</h2>
              <p className="text-xs text-zinc-500">
                Gestiona tus triggers de snippets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Create Form */}
          {showCreateForm ? (
            <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Crear Nuevo Snippet</h3>

              {error && (
                <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Trigger */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Trigger (ej., /ayuda)
                  </label>
                  <input
                    type="text"
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    placeholder="/my-trigger"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Tipo
                  </label>
                  <div className="flex gap-2">
                    {(["PROMPT", "CODE", "FIX"] as const).map((t) => {
                      const config = TYPE_CONFIG[t];
                      const Icon = config.icon;
                      return (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors",
                            type === t
                              ? `${config.bg} border-${config.color.replace("text-", "")} ${config.color}`
                              : "border-zinc-700 hover:bg-zinc-800"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Contenido
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="El contenido que reemplazará el trigger..."
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={createSnippet}
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Crear Snippet
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setError(null);
                    }}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-4 w-full px-4 py-3 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-purple-400 hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir Nuevo Snippet
            </button>
          )}

          {/* Snippets List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Vault className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay snippets aún</p>
              <p className="text-sm">¡Crea tu primer trigger!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snippets.map((snippet) => {
                const config = TYPE_CONFIG[snippet.type];
                const Icon = config.icon;

                return (
                  <div
                    key={snippet.id}
                    className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-mono",
                            config.bg,
                            config.color
                          )}
                        >
                          {snippet.trigger}
                        </span>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <button
                        onClick={() => deleteSnippet(snippet.id)}
                        disabled={deletingId === snippet.id}
                        className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        {deletingId === snippet.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                      {snippet.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
