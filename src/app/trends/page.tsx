"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Radio, RefreshCw, GraduationCap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  TrendFilters,
  TrendList,
  AudioPlayer,
  LearningView,
  type Trend,
  type LearningData,
} from "./components";

/**
 * TrendsPage - Trend Radar dashboard
 * 
 * Refactored from 429 lines to ~140 lines by extracting:
 * - TrendFilters (sidebar)
 * - TrendCard (individual item) 
 * - TrendList (list with states)
 * - AudioPlayer (sticky player)
 * - LearningView (analyzed content)
 */
export default function TrendsPage() {
  // Data state
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<"list" | "learn">("list");
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  
  // Learning state
  const [learningContent, setLearningContent] = useState<LearningData | null>(null);
  const [generatingLearning, setGeneratingLearning] = useState(false);
  
  // Audio state
  const [audioData, setAudioData] = useState<{ audio: string; script: string } | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const trendsByDate = useMemo(() => {
    const grouped: Record<string, Trend[]> = {};
    for (const trend of trends) {
      const date = new Date(trend.fetchedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(trend);
    }
    return grouped;
  }, [trends]);

  const dates = useMemo(
    () => Object.keys(trendsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [trendsByDate]
  );

  const filteredTrends = useMemo(() => {
    let result = trends;
    if (selectedDate) result = trendsByDate[selectedDate] || [];
    if (selectedCategory) result = result.filter((t) => t.category === selectedCategory);
    return result.sort((a, b) => b.heatScore - a.heatScore);
  }, [trends, selectedDate, selectedCategory, trendsByDate]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const t of trends) byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    return { total: trends.length, byCategory, dates: dates.length };
  }, [trends, dates]);

  // ============================================================================
  // API Actions
  // ============================================================================

  const loadTrends = useCallback(async () => {
    try {
      const res = await fetch("/api/trends?limit=100");
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNewTrends = async () => {
    setFetching(true);
    try {
      await fetch("/api/trends", { method: "POST" });
      loadTrends();
    } finally {
      setFetching(false);
    }
  };

  const generateLearning = async () => {
    setGeneratingLearning(true);
    setViewMode("learn");
    try {
      const res = await fetch("/api/trends/learn", { method: "POST" });
      const data = await res.json();
      if (data.content) setLearningContent(data);
    } catch {
      alert("Error generando contenido");
    } finally {
      setGeneratingLearning(false);
    }
  };

  const generatePodcast = async () => {
    setGeneratingAudio(true);
    try {
      const res = await fetch("/api/trends/audio", { method: "POST" });
      const data = await res.json();
      if (data.audio) setAudioData({ audio: data.audio, script: data.script });
      else alert(data.error || "Error generando audio");
    } catch {
      alert("Error generando podcast");
    } finally {
      setGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (!audioData?.audio) return;
    const link = document.createElement("a");
    link.href = audioData.audio;
    link.download = `trend-radar-${new Date().toISOString().split("T")[0]}.mp3`;
    link.click();
  };

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-surface-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gradient">📡 Trend Radar</h1>
            <div className="flex gap-1">
              <Badge variant="default">{stats.total} trends</Badge>
              <Badge variant="default">{stats.dates} días</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {learningContent && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setLearningContent(null); setViewMode("list"); }}
                >
                  📋 Lista
                </Button>
                <Button variant="primary" size="sm" leftIcon={MessageSquare}>
                  Chat con Claude
                </Button>
              </>
            )}
            <Button
              variant={viewMode === "learn" ? "primary" : "default"}
              size="sm"
              leftIcon={GraduationCap}
              isLoading={generatingLearning}
              onClick={learningContent ? () => setViewMode("learn") : generateLearning}
            >
              {generatingLearning ? "Analizando..." : viewMode === "learn" ? "✓ Analizado" : "Aprender"}
            </Button>
            <Button
              variant="default"
              size="sm"
              leftIcon={Radio}
              isLoading={generatingAudio}
              onClick={generatePodcast}
            >
              {generatingAudio ? "Generando..." : "Podcast"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={fetching ? Loader2 : RefreshCw}
              isLoading={fetching}
              onClick={fetchNewTrends}
            >
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {audioData && (
        <AudioPlayer
          audioUrl={audioData.audio}
          onClose={() => setAudioData(null)}
          onDownload={downloadAudio}
        />
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 flex gap-4">
        <TrendFilters
          dates={dates}
          trendsByDate={trendsByDate as Record<string, { length: number }[]>}
          selectedDate={selectedDate}
          selectedCategory={selectedCategory}
          totalTrends={stats.total}
          categoryStats={stats.byCategory}
          onDateChange={setSelectedDate}
          onCategoryChange={setSelectedCategory}
        />

        <div className="flex-1 min-w-0">
          {viewMode === "learn" && learningContent ? (
            <LearningView data={learningContent} />
          ) : (
            <TrendList
              trends={filteredTrends}
              loading={loading}
              expandedId={expandedTrend}
              onToggleExpand={setExpandedTrend}
              onFetchNew={fetchNewTrends}
            />
          )}
        </div>
      </div>
    </div>
  );
}
