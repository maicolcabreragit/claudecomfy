"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendAnalysisProps {
  content: string;
  audioUrl?: string | null;
}

/**
 * TrendAnalysis - Displays generated analysis content
 */
export function TrendAnalysis({ content, audioUrl }: TrendAnalysisProps) {
  // Parse content sections (assumes markdown-like structure)
  const sections = parseAnalysisSections(content);

  return (
    <div className="space-y-6">
      {/* Audio player if available */}
      {audioUrl && (
        <div className="p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl border border-orange-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Volume2 className="h-5 w-5 text-orange-400" />
            <span className="font-medium text-foreground">Escuchar como podcast</span>
          </div>
          <audio 
            controls 
            src={audioUrl} 
            className="w-full h-10"
          />
        </div>
      )}

      {/* Executive Summary */}
      {sections.summary && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            📝 Resumen Ejecutivo
          </h2>
          <div className="prose-academy">
            <p>{sections.summary}</p>
          </div>
        </section>
      )}

      {/* Practical Applications */}
      {sections.applications && sections.applications.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            💡 Aplicaciones Prácticas
          </h2>
          <ul className="space-y-2">
            {sections.applications.map((app, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg",
                  "bg-surface-elevated border border-border-subtle"
                )}
              >
                <span className="text-accent-purple font-bold shrink-0">
                  {i + 1}.
                </span>
                <span className="text-foreground-muted">{app}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Resources */}
      {sections.resources && sections.resources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            📚 Recursos Relacionados
          </h2>
          <ul className="space-y-2">
            {sections.resources.map((resource, i) => (
              <li key={i} className="text-foreground-muted">
                • {resource}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Full content if no sections parsed */}
      {!sections.summary && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            📖 Análisis Completo
          </h2>
          <div className="prose-academy whitespace-pre-wrap">
            {content}
          </div>
        </section>
      )}
    </div>
  );
}

interface ParsedSections {
  summary?: string;
  applications?: string[];
  resources?: string[];
}

/**
 * Parse analysis content into structured sections
 */
function parseAnalysisSections(content: string): ParsedSections {
  const sections: ParsedSections = {};

  // Try to extract summary (first paragraph or section)
  const summaryMatch = content.match(/(?:resumen|summary)[:\s]*(.+?)(?:\n\n|$)/i);
  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim();
  } else {
    // Use first paragraph as summary
    const firstPara = content.split("\n\n")[0];
    if (firstPara && firstPara.length < 500) {
      sections.summary = firstPara;
    }
  }

  // Try to extract applications (numbered list or bullet points)
  const appMatch = content.match(/(?:aplicaciones?|uses?|how to)[:\s]*\n((?:[-•\d]\.?\s+.+\n?)+)/i);
  if (appMatch) {
    sections.applications = appMatch[1]
      .split("\n")
      .map(line => line.replace(/^[-•\d.)\s]+/, "").trim())
      .filter(line => line.length > 0);
  }

  // Try to extract resources
  const resourceMatch = content.match(/(?:recursos?|resources?|links?)[:\s]*\n((?:[-•]\s+.+\n?)+)/i);
  if (resourceMatch) {
    sections.resources = resourceMatch[1]
      .split("\n")
      .map(line => line.replace(/^[-•]\s*/, "").trim())
      .filter(line => line.length > 0);
  }

  return sections;
}
