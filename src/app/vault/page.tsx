"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Archive,
  Plus,
  Trash2,
  Loader2,
  Code,
  Lightbulb,
  Wrench,
  Search,
  Copy,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Snippet {
  id: string;
  trigger: string;
  content: string;
  type: "PROMPT" | "CODE" | "FIX";
  tags: string[];
  createdAt: string;
}

type SnippetType = "PROMPT" | "CODE" | "FIX";

const TYPE_CONFIG: Record<SnippetType, { icon: typeof Code; label: string; variant: "primary" | "success" | "warning" }> = {
  PROMPT: { icon: Lightbulb, label: "Prompt", variant: "warning" },
  CODE: { icon: Code, label: "Código", variant: "primary" },
  FIX: { icon: Wrench, label: "Fix", variant: "success" },
};

const TYPES: SnippetType[] = ["PROMPT", "CODE", "FIX"];

/**
 * VaultPage - Full-page snippet management
 */
export default function VaultPage() {
  // Data state
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SnippetType | null>(null);
  
  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState("/");
  const [content, setContent] = useState("");
  const [type, setType] = useState<SnippetType>("PROMPT");
  
  // Actions state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch snippets
  useEffect(() => {
    fetchSnippets();
  }, []);

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
    setFormError(null);

    if (!trigger.startsWith("/") || trigger.length < 2) {
      setFormError("Trigger must start with / and have at least 2 characters");
      return;
    }
    if (!content.trim()) {
      setFormError("Content is required");
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
        setFormError(data.error || "Failed to create snippet");
        return;
      }

      setSnippets((prev) => [data.snippet, ...prev]);
      resetForm();
    } catch {
      setFormError("Network error");
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

  const copyToClipboard = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  function resetForm() {
    setShowForm(false);
    setTrigger("/");
    setContent("");
    setType("PROMPT");
    setFormError(null);
  }

  // Filter snippets
  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      search === "" ||
      snippet.trigger.toLowerCase().includes(search.toLowerCase()) ||
      snippet.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === null || snippet.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-purple/20 rounded-xl">
              <Archive className="h-6 w-6 text-accent-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">La Bóveda</h1>
              <p className="text-sm text-zinc-500">
                Gestiona tus snippets y triggers rápidos
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setShowForm(true)}
          >
            Nuevo Snippet
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por trigger o contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={Search}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === null ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter(null)}
            >
              Todos
            </Button>
            {TYPES.map((t) => {
              const config = TYPE_CONFIG[t];
              const Icon = config.icon;
              return (
                <Button
                  key={t}
                  variant={typeFilter === t ? "primary" : "ghost"}
                  size="sm"
                  leftIcon={Icon}
                  onClick={() => setTypeFilter(t)}
                >
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <Card className="border-accent-purple/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Crear Nuevo Snippet</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="p-3 bg-semantic-error/10 border border-semantic-error/30 rounded-lg text-sm text-semantic-error">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Trigger (ej., /ayuda)
                  </label>
                  <Input
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    placeholder="/my-trigger"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Tipo
                  </label>
                  <div className="flex gap-2">
                    {TYPES.map((t) => {
                      const config = TYPE_CONFIG[t];
                      const Icon = config.icon;
                      return (
                        <Button
                          key={t}
                          variant={type === t ? "primary" : "outline"}
                          size="sm"
                          className="flex-1"
                          leftIcon={Icon}
                          onClick={() => setType(t)}
                        >
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">
                  Contenido
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="El contenido que reemplazará el trigger..."
                  rows={4}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border border-surface-border",
                    "bg-surface-base text-foreground placeholder:text-zinc-500",
                    "focus:outline-none focus:ring-2 focus:ring-accent-purple/50",
                    "resize-none"
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={createSnippet}
                  isLoading={isCreating}
                  leftIcon={Plus}
                  className="flex-1"
                >
                  Crear Snippet
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="text-center py-16">
            <Archive className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              {snippets.length === 0
                ? "La Bóveda está vacía"
                : "No hay resultados"}
            </h3>
            <p className="text-sm text-zinc-500">
              {snippets.length === 0
                ? "Crea tu primer snippet para empezar"
                : "Intenta con otros términos de búsqueda"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSnippets.map((snippet) => {
              const config = TYPE_CONFIG[snippet.type];
              const Icon = config.icon;
              const isCopied = copiedId === snippet.id;
              const isDeleting = deletingId === snippet.id;

              return (
                <Card key={snippet.id} interactive>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-surface-elevated rounded text-sm font-mono text-accent-purple">
                          {snippet.trigger}
                        </code>
                        <Badge variant={config.variant} size="sm">
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Content preview */}
                    <p className="text-sm text-zinc-400 line-clamp-3 mb-4 min-h-[3.75rem]">
                      {snippet.content}
                    </p>

                    {/* Tags */}
                    {snippet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {snippet.tags.map((tag) => (
                          <Badge key={tag} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-surface-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        leftIcon={isCopied ? Check : Copy}
                        onClick={() => copyToClipboard(snippet.id, snippet.content)}
                      >
                        {isCopied ? "Copiado" : "Copiar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-semantic-error hover:bg-semantic-error/10"
                        leftIcon={isDeleting ? Loader2 : Trash2}
                        onClick={() => deleteSnippet(snippet.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "" : "Eliminar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats footer */}
        {snippets.length > 0 && (
          <div className="text-center text-xs text-zinc-500 pt-4">
            {filteredSnippets.length} de {snippets.length} snippets
          </div>
        )}
      </div>
    </div>
  );
}
