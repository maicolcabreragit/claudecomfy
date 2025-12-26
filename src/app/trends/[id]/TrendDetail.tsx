"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Radio,
  MessageSquare,
  Calendar,
  Tag,
  Flame,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/layout";
import { TrendAnalysis } from "./TrendAnalysis";
import { CATEGORY_CONFIG } from "../components/types";

interface TrendData {
  id: string;
  title: string;
  description: string;
  url: string | null;
  source: string;
  category: string;
  heatScore: number;
  keywords: string[];
  publishedAt: string | null;
  fetchedAt: string;
}

interface TrendDetailProps {
  trend: TrendData;
}

/**
 * TrendDetail - Client component for trend detail view
 */
export function TrendDetail({ trend }: TrendDetailProps) {
  const router = useRouter();
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const cat = CATEGORY_CONFIG[trend.category as keyof typeof CATEGORY_CONFIG] || {
    label: trend.category,
    emoji: "📌",
  };

  const scoreColor = getScoreColor(trend.heatScore);

  // Generate analysis via API
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      const res = await fetch("/api/trends/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendIds: [trend.id] }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.content || data.summary);
      }
    } catch (error) {
      console.error("Failed to generate analysis:", error);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Generate podcast
  const handleGeneratePodcast = async () => {
    if (!analysis) return;
    
    setIsGeneratingPodcast(true);
    try {
      const res = await fetch("/api/trends/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: analysis }),
      });

      if (res.ok) {
        const data = await res.json();
        setAudioUrl(data.audioUrl);
      }
    } catch (error) {
      console.error("Failed to generate podcast:", error);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  // Send to chat with context
  const handleSendToChat = () => {
    // Create conversation with trend context
    const context = `
Quiero profundizar en esta tendencia:

**${trend.title}**
${trend.description}

Categoría: ${cat.label}
Score: ${trend.heatScore}
${trend.url ? `Fuente: ${trend.url}` : ""}

${analysis ? `\n\nAnálisis previo:\n${analysis.slice(0, 500)}...` : ""}
    `.trim();

    // Store context in sessionStorage and redirect
    sessionStorage.setItem("trendContext", context);
    router.push("/");
  };

  const formattedDate = trend.publishedAt
    ? new Date(trend.publishedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(trend.fetchedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Trends", href: "/trends" },
          { label: trend.title.slice(0, 30) + (trend.title.length > 30 ? "..." : "") },
        ]}
      />

      {/* Header */}
      <div className="space-y-4">
        {/* Back button */}
        <Link
          href="/trends"
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Trends
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">{trend.title}</h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Score */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            scoreColor.bg
          )}>
            <Flame className={cn("h-4 w-4", scoreColor.text)} />
            <span className={cn("font-bold", scoreColor.text)}>{trend.heatScore}</span>
          </div>

          {/* Category */}
          <Badge variant="default">
            {cat.emoji} {cat.label}
          </Badge>

          {/* Source */}
          <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <Tag className="h-3.5 w-3.5" />
            {trend.source}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            leftIcon={isGeneratingAnalysis ? Loader2 : GraduationCap}
            onClick={handleGenerateAnalysis}
            disabled={isGeneratingAnalysis || !!analysis}
            className={isGeneratingAnalysis ? "[&>svg]:animate-spin" : ""}
          >
            {analysis ? "Análisis generado" : isGeneratingAnalysis ? "Generando..." : "Generar análisis"}
          </Button>

          <Button
            variant="default"
            leftIcon={isGeneratingPodcast ? Loader2 : Radio}
            onClick={handleGeneratePodcast}
            disabled={!analysis || isGeneratingPodcast || !!audioUrl}
            className={isGeneratingPodcast ? "[&>svg]:animate-spin" : ""}
          >
            {audioUrl ? "Podcast listo" : "Generar podcast"}
          </Button>

          <Button
            variant="ghost"
            leftIcon={MessageSquare}
            onClick={handleSendToChat}
          >
            Enviar a Chat
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border-subtle" />

      {/* Description */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          📝 Descripción
        </h2>
        <p className="text-foreground-muted leading-relaxed">
          {trend.description}
        </p>
      </section>

      {/* Original source */}
      {trend.url && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🔗 Fuente Original
          </h2>
          <a
            href={trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-3 rounded-lg",
              "bg-surface-elevated border border-border-subtle",
              "text-accent-purple hover:text-accent-purple/80",
              "hover:border-accent-purple/30 transition-colors"
            )}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="truncate max-w-md">{trend.url}</span>
          </a>
        </section>
      )}

      {/* Keywords */}
      {trend.keywords && trend.keywords.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🏷️ Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {trend.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 text-sm bg-surface-overlay rounded-full text-foreground-muted"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="h-px bg-border-subtle" />

      {/* Analysis */}
      {analysis && (
        <TrendAnalysis content={analysis} audioUrl={audioUrl} />
      )}

      {/* CTA if no analysis */}
      {!analysis && (
        <section className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent-purple/20 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-accent-purple" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            ¿Quieres profundizar en esta tendencia?
          </h3>
          <p className="text-foreground-muted max-w-md mx-auto">
            Genera un análisis completo con aplicaciones prácticas y recursos relacionados.
          </p>
          <Button
            variant="primary"
            size="lg"
            leftIcon={isGeneratingAnalysis ? Loader2 : GraduationCap}
            onClick={handleGenerateAnalysis}
            disabled={isGeneratingAnalysis}
            className={isGeneratingAnalysis ? "[&>svg]:animate-spin" : ""}
          >
            Generar análisis completo
          </Button>
        </section>
      )}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 90) return { bg: "bg-semantic-success/20", text: "text-semantic-success" };
  if (score >= 75) return { bg: "bg-orange-500/20", text: "text-orange-400" };
  if (score >= 50) return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
  return { bg: "bg-surface-overlay", text: "text-foreground-subtle" };
}
