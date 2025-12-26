"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Pause, 
  Type, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PAUSE_OPTIONS, SECTION_LABELS, type ScriptSection } from "./types";

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: { start: number; end: number; text: string } | null) => void;
  className?: string;
  disabled?: boolean;
}

const WORDS_PER_MINUTE = 150;

/**
 * ScriptEditor - Rich textarea for podcast scripts
 * 
 * Features:
 * - Section detection ([INTRO], [HOOK], etc.)
 * - Word count and duration estimation
 * - Quick insert buttons for pauses and emphasis
 * - Collapsible sections
 */
export function ScriptEditor({
  value,
  onChange,
  onSelectionChange,
  className,
  disabled = false,
}: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Parse sections from script
  const sections = useMemo(() => {
    const result: ScriptSection[] = [];
    const sectionRegex = /\[(INTRO|HOOK|CONTENIDO|CONTENT|VALOR|VALUE|CIERRE|OUTRO)\]/gi;
    const matches = [...value.matchAll(sectionRegex)];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      
      const type = normalizeSectionType(match[1]);
      const startIndex = match.index!;
      const endIndex = nextMatch?.index || value.length;
      
      result.push({
        type,
        label: SECTION_LABELS[type],
        startIndex,
        endIndex,
        content: value.slice(startIndex, endIndex),
      });
    }
    
    return result;
  }, [value]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const cleanText = value.replace(/<[^>]+>/g, "").replace(/\[[^\]]+\]/g, "");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0).length;
    const chars = value.length;
    const duration = Math.round((words / WORDS_PER_MINUTE) * 60);
    const pauseCount = (value.match(/<break/g) || []).length;
    const emphasisCount = (value.match(/[A-ZÁÉÍÓÚÑ]{3,}/g) || []).length;
    
    return { words, chars, duration, pauseCount, emphasisCount };
  }, [value]);

  // Handle selection changes
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    setSelectionStart(textarea.selectionStart);
    setSelectionEnd(textarea.selectionEnd);
    
    if (onSelectionChange) {
      if (textarea.selectionStart !== textarea.selectionEnd) {
        onSelectionChange({
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
          text: value.slice(textarea.selectionStart, textarea.selectionEnd),
        });
      } else {
        onSelectionChange(null);
      }
    }
  }, [value, onSelectionChange]);

  // Insert text at cursor
  const insertAtCursor = useCallback((insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    
    // Restore cursor position after insert
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    });
  }, [value, onChange]);

  // Convert selection to emphasis (uppercase)
  const emphasizeSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || selectionStart === selectionEnd) return;
    
    const selectedText = value.slice(selectionStart, selectionEnd);
    const emphasized = selectedText.toUpperCase();
    
    const newValue = value.slice(0, selectionStart) + emphasized + value.slice(selectionEnd);
    onChange(newValue);
    
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + emphasized.length);
    });
  }, [value, onChange, selectionStart, selectionEnd]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current || document.activeElement !== textareaRef.current) return;
      
      // Cmd/Ctrl + B = Emphasis
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        emphasizeSelection();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [emphasizeSelection]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSection = (sectionType: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-surface-border bg-surface-base">
        {/* Insert pause buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 mr-1">Pausas:</span>
          {PAUSE_OPTIONS.map((pause) => (
            <button
              key={pause.value}
              type="button"
              onClick={() => insertAtCursor(pause.value)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs rounded",
                "bg-surface-elevated hover:bg-surface-overlay",
                "border border-surface-border",
                "text-zinc-400 hover:text-foreground",
                "transition-colors",
                "disabled:opacity-50"
              )}
              title={pause.label}
            >
              {pause.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-surface-border mx-2" />

        {/* Emphasis button */}
        <button
          type="button"
          onClick={emphasizeSelection}
          disabled={disabled || selectionStart === selectionEnd}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs rounded",
            "bg-surface-elevated hover:bg-surface-overlay",
            "border border-surface-border",
            "text-zinc-400 hover:text-foreground",
            "transition-colors",
            "disabled:opacity-50"
          )}
          title="Convertir a mayúsculas (Cmd+B)"
        >
          <Type className="h-3 w-3" />
          ÉNFASIS
        </button>

        <div className="flex-1" />

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1" title="Palabras">
            <FileText className="h-3 w-3" />
            {metrics.words} palabras
          </span>
          <span className="flex items-center gap-1" title="Duración estimada">
            <Clock className="h-3 w-3" />
            ~{formatDuration(metrics.duration)}
          </span>
          <span className="flex items-center gap-1" title="Pausas">
            <Pause className="h-3 w-3" />
            {metrics.pauseCount}
          </span>
        </div>
      </div>

      {/* Sections sidebar + Editor */}
      <div className="flex-1 flex min-h-0">
        {/* Sections list */}
        {sections.length > 0 && (
          <div className="w-48 shrink-0 border-r border-surface-border bg-surface-base overflow-y-auto">
            <div className="p-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Secciones
            </div>
            {sections.map((section, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  // Scroll to section in textarea
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(section.startIndex, section.startIndex);
                    // Scroll into view
                    const lineHeight = 24;
                    const lineNumber = value.slice(0, section.startIndex).split("\n").length;
                    textareaRef.current.scrollTop = lineNumber * lineHeight - 100;
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left",
                  "hover:bg-surface-elevated transition-colors",
                  "text-sm text-zinc-300"
                )}
              >
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleSelect}
            disabled={disabled}
            className={cn(
              "absolute inset-0 w-full h-full resize-none",
              "bg-surface-base text-foreground",
              "p-4 font-mono text-sm leading-relaxed",
              "focus:outline-none",
              "placeholder:text-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            placeholder="[INTRO]
Hola, bienvenidos de vuelta a...

[HOOK]
Hoy te traigo algo increíble...

[CONTENIDO]
Empecemos con la primera noticia..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

function normalizeSectionType(type: string): ScriptSection["type"] {
  const normalized = type.toUpperCase();
  switch (normalized) {
    case "INTRO": return "intro";
    case "HOOK": return "hook";
    case "CONTENIDO":
    case "CONTENT": return "content";
    case "VALOR":
    case "VALUE": return "value";
    case "CIERRE":
    case "OUTRO": return "outro";
    default: return "content";
  }
}
