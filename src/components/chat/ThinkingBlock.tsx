"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  content: string;
  className?: string;
}

/**
 * Collapsible ThinkingBlock component
 * 
 * Displays Claude Opus 4.5's extended thinking/reasoning in a 
 * distinct amber-bordered collapsible block.
 */
export function ThinkingBlock({ content, className }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || content.trim().length === 0) {
    return null;
  }

  // Count approximate tokens for display
  const estimatedTokens = Math.ceil(content.length / 4);

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border-2 border-amber-500/40 bg-amber-500/5",
        "transition-all duration-200",
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center gap-2 px-4 py-3",
          "text-left text-sm font-medium text-amber-300",
          "hover:bg-amber-500/10 transition-colors rounded-t-lg",
          !isExpanded && "rounded-b-lg"
        )}
      >
        <Brain className="h-4 w-4 text-amber-400" />
        <span>Razonamiento Extendido</span>
        <span className="ml-2 text-xs text-amber-400/60">
          (~{estimatedTokens.toLocaleString()} tokens)
        </span>
        {isExpanded ? (
          <ChevronDown className="ml-auto h-4 w-4" />
        ) : (
          <ChevronRight className="ml-auto h-4 w-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-amber-500/30 px-4 py-3 max-h-[400px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-amber-200/80 font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Extract thinking content from a message
 * 
 * Looks for content inside <thinking>...</thinking> tags
 * Returns both the thinking content and the cleaned message
 */
export function extractThinking(text: string): {
  thinking: string;
  content: string;
} {
  // Handle null/undefined input
  if (!text) {
    return { thinking: "", content: "" };
  }
  
  // Match <thinking>...</thinking> blocks (case insensitive, multiline)
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
  
  const thinkingBlocks: string[] = [];
  let match;
  
  while ((match = thinkingRegex.exec(text)) !== null) {
    thinkingBlocks.push(match[1].trim());
  }
  
  // Remove thinking blocks from the content
  const cleanedContent = text.replace(thinkingRegex, "").trim();
  
  return {
    thinking: thinkingBlocks.join("\n\n---\n\n"),
    content: cleanedContent,
  };
}
