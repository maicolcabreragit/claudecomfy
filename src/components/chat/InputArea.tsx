"use client";

import { useRef, useCallback } from "react";
import { Send, Loader2, ImagePlus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputAreaProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileSelect: (files: FileList | null) => void;
  previewUrls: string[];
  onRemoveAttachment: (index: number) => void;
  isLoading: boolean;
  hasAttachments: boolean;
  hasKnowledgeContext: boolean;
}

/**
 * InputArea - Chat input with attachments and drag-drop
 */
export function InputArea({
  input,
  onInputChange,
  onSubmit,
  onPaste,
  onFileSelect,
  previewUrls,
  onRemoveAttachment,
  isLoading,
  hasAttachments,
  hasKnowledgeContext,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e as unknown as React.FormEvent);
      }
    },
    [onSubmit]
  );

  return (
    <div className="border-t border-surface-border p-4 bg-surface-base">
      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Attachment ${index + 1}`}
                className="h-16 w-16 object-cover rounded-lg border border-surface-border"
              />
              <button
                type="button"
                onClick={() => onRemoveAttachment(index)}
                className="absolute -top-2 -right-2 p-1 bg-semantic-error rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="max-w-3xl mx-auto flex items-end gap-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={onInputChange}
            placeholder={
              hasAttachments
                ? "Describe o pregunta sobre estas imágenes..."
                : "Escribe un mensaje..."
            }
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-surface-border",
              "bg-surface-elevated px-4 py-3 pr-12",
              "text-foreground placeholder:text-zinc-500",
              "focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50",
              "min-h-[48px] max-h-[200px]"
            )}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
          />
          
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "absolute right-12 bottom-3 p-1 transition-colors",
              hasAttachments
                ? "text-accent-purple hover:text-accent-purple/80"
                : "text-zinc-500 hover:text-zinc-300"
            )}
            title="Upload image for vision analysis"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !hasAttachments)}
          className={cn(
            "p-3 rounded-xl bg-accent-purple text-white",
            "hover:bg-accent-purple/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
      
      {/* Context indicator */}
      {hasKnowledgeContext && (
        <div className="max-w-3xl mx-auto mt-2 flex items-center gap-1 text-xs text-accent-purple">
          <Sparkles className="h-3 w-3" />
          <span>Contexto de conocimiento activo</span>
        </div>
      )}
    </div>
  );
}
