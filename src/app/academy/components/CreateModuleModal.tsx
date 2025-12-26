"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ============================================================================
// Types
// ============================================================================

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function CreateModuleModal({ 
  isOpen, 
  onClose, 
  onCreated 
}: CreateModuleModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("El título es requerido");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/learning/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: title.trim(),
          title: title.trim(),
          description: description.trim() || null,
          isManual: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create module");
      }

      // Reset form
      setTitle("");
      setDescription("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el curso");
    } finally {
      setIsCreating(false);
    }
  }

  function handleClose() {
    if (!isCreating) {
      setTitle("");
      setDescription("");
      setError(null);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-base border border-surface-border rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold">Nuevo Curso</h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label 
              htmlFor="module-title" 
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Título del curso *
            </label>
            <input
              id="module-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: Monetización con Flux.1"
              disabled={isCreating}
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="module-description" 
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué quieres aprender en este curso?"
              rows={3}
              disabled={isCreating}
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-semantic-error">{error}</p>
          )}

          {/* Tip */}
          <p className="text-xs text-zinc-500">
            💡 Las unidades del curso se añadirán automáticamente cuando 
            preguntes sobre este tema en el chat.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isCreating || !title.trim()}
              leftIcon={isCreating ? Loader2 : Plus}
              className={isCreating ? "[&>svg]:animate-spin" : ""}
            >
              {isCreating ? "Creando..." : "Crear Curso"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
