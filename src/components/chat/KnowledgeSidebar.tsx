"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, Check, AlertCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseAndGetContext } from "@/lib/parse-claude-export";

interface KnowledgeSidebarProps {
  contextString: string;
  onContextChange: (context: string) => void;
  className?: string;
}

interface LoadedContext {
  title: string;
  charCount: number;
  estimatedTokens: number;
  conversationCount: number;
}

/**
 * Knowledge Sidebar Component
 * 
 * Provides file upload (drag & drop) for Claude.ai export JSON files.
 * Parses and stores the context string for injection into chat requests.
 */
export function KnowledgeSidebar({
  contextString,
  onContextChange,
  className,
}: KnowledgeSidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedContext, setLoadedContext] = useState<LoadedContext | null>(null);
  
  // Track if context is loaded (used for conditional rendering)
  const isActive = contextString.length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        // Validate file type
        if (!file.name.endsWith(".json")) {
          throw new Error("Please upload a JSON file (conversations.json)");
        }

        const content = await file.text();
        const result = parseAndGetContext(content);

        if (result.metadata.charCount === 0) {
          throw new Error("No valid conversations found in the export file");
        }

        onContextChange(result.contextString);
        setLoadedContext({
          title: result.metadata.selectedTitle,
          charCount: result.metadata.charCount,
          estimatedTokens: result.metadata.estimatedTokens,
          conversationCount: result.metadata.conversationCount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
        onContextChange("");
        setLoadedContext(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onContextChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const jsonFile = files.find((f) => f.name.endsWith(".json"));

      if (jsonFile) {
        handleFile(jsonFile);
      } else {
        setError("Please drop a JSON file");
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearContext = useCallback(() => {
    onContextChange("");
    setLoadedContext(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onContextChange]);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 overflow-y-auto",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-zinc-100">Base de Conocimiento</h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Sube exportaciones de Claude.ai para inyección de contexto
        </p>
      </div>

      {/* Drop Zone */}
      <div className="p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
          id="knowledge-file-input"
        />

        <label
          htmlFor="knowledge-file-input"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center",
            "rounded-lg border-2 border-dashed p-6 cursor-pointer",
            "transition-all duration-200",
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50",
            isLoading && "opacity-50 pointer-events-none"
          )}
        >
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400 text-center">
                Arrastra <code className="text-purple-400">conversations.json</code>
              </p>
              <p className="text-xs text-zinc-600 mt-1">o haz clic para buscar</p>
            </>
          )}
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loaded Context Display */}
      {loadedContext && (
        <div className="mx-4 mt-2">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-green-300 font-medium">
                    Contexto Cargado
                  </p>
                  <p className="text-xs text-green-400/70 mt-1 truncate max-w-[180px]">
                    {loadedContext.title}
                  </p>
                </div>
              </div>
              <button
                onClick={clearContext}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
              <FileText className="h-3 w-3" />
              {loadedContext.charCount.toLocaleString()} caracteres
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs">
              ~{loadedContext.estimatedTokens.toLocaleString()} tokens
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                Activo
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
