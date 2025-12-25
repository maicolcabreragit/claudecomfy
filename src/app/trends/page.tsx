"use client";

import { useState, useEffect, useMemo } from "react";

interface Trend {
  id: string;
  title: string;
  description: string;
  url: string | null;
  source: string;
  category: string;
  heatScore: number;
  fetchedAt: string;
}

interface LearningTrend {
  title: string;
  url: string;
  summary: string;
  keyTakeaways: string[];
  practicalSteps: string[];
  monetizationAngle: string;
  questionsToExplore: string[];
}

interface LearningData {
  summary: string;
  content: Array<{
    category: string;
    trends: LearningTrend[];
  }>;
}

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  FLUX_TECHNIQUES: { label: "Flux", emoji: "🎨", color: "purple" },
  LORA_MODELS: { label: "LoRA", emoji: "🧠", color: "blue" },
  MONETIZATION: { label: "Dinero", emoji: "💰", color: "green" },
  ANTI_DETECTION: { label: "Stealth", emoji: "🔒", color: "red" },
  TOOLS: { label: "Tools", emoji: "🛠️", color: "orange" },
  NEWS: { label: "News", emoji: "📰", color: "pink" },
};

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "learn">("list");
  const [learningContent, setLearningContent] = useState<LearningData | null>(null);
  const [generatingLearning, setGeneratingLearning] = useState(false);
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<{ audio: string; script: string } | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  // Group trends by date
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

  const dates = useMemo(() => Object.keys(trendsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  ), [trendsByDate]);

  // Filter trends
  const filteredTrends = useMemo(() => {
    let result = trends;
    if (selectedDate) {
      result = trendsByDate[selectedDate] || [];
    }
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }
    return result.sort((a, b) => b.heatScore - a.heatScore);
  }, [trends, selectedDate, selectedCategory, trendsByDate]);

  const loadTrends = async () => {
    try {
      const res = await fetch("/api/trends?limit=100");
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (error) {
      console.error("Error loading trends:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewTrends = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/trends", { method: "POST" });
      const data = await res.json();
      loadTrends();
      return data.message;
    } catch {
      return "Error";
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
      if (data.content) {
        setLearningContent(data);
      }
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
      if (data.audio) {
        setAudioData({ audio: data.audio, script: data.script });
      } else {
        alert(data.error || "Error generando audio");
      }
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

  const sendToChat = async () => {
    try {
      const res = await fetch("/api/trends/to-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningContent }),
      });
      const data = await res.json();
      if (data.conversationId) {
        window.location.href = `/?conversation=${data.conversationId}`;
      } else {
        alert(data.error || "Error creando curso");
      }
    } catch {
      alert("Error enviando a chat");
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const t of trends) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    }
    return { total: trends.length, byCategory, dates: dates.length };
  }, [trends, dates]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              📡 Trend Radar
            </h1>
            <div className="flex gap-1 text-xs">
              <span className="px-2 py-1 bg-gray-800 rounded">{stats.total} trends</span>
              <span className="px-2 py-1 bg-gray-800 rounded">{stats.dates} días</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {learningContent && (
              <>
                <button
                  onClick={() => { setLearningContent(null); setViewMode("list"); }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  📋 Lista
                </button>
                <button
                  onClick={sendToChat}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded text-sm"
                >
                  💬 Chat con Claude
                </button>
              </>
            )}
            <button
              onClick={async () => {
                if (viewMode === "learn" && learningContent) {
                  setViewMode("list");
                } else {
                  await generateLearning();
                }
              }}
              disabled={generatingLearning}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                generatingLearning 
                  ? "bg-yellow-600 animate-pulse" 
                  : viewMode === "learn" 
                    ? "bg-green-600" 
                    : "bg-gradient-to-r from-green-500 to-emerald-500"
              }`}
            >
              {generatingLearning ? "🧠 Analizando..." : viewMode === "learn" ? "✓ Analizado" : "🎓 Aprender"}
            </button>
            <button
              onClick={generatePodcast}
              disabled={generatingAudio}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                generatingAudio 
                  ? "bg-orange-600 animate-pulse" 
                  : "bg-gradient-to-r from-orange-500 to-red-500"
              }`}
            >
              {generatingAudio ? "🎙️ Generando..." : "📻 Podcast"}
            </button>
            <button
              onClick={fetchNewTrends}
              disabled={fetching}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm disabled:opacity-50"
            >
              {fetching ? "⏳" : "🔄 Buscar"}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {audioData && (
        <div className="sticky top-14 z-10 bg-gradient-to-r from-orange-900/90 to-red-900/90 backdrop-blur border-b border-orange-500/50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <span className="text-lg">📻</span>
            <audio controls className="flex-1 h-8" src={audioData.audio} />
            <button
              onClick={downloadAudio}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm"
            >
              ⬇️ Descargar
            </button>
            <button
              onClick={() => setAudioData(null)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto p-4 flex gap-4">
        {/* Sidebar - Date Folders */}
        <div className="w-48 flex-shrink-0">
          <div className="sticky top-20 space-y-2">
            <h3 className="text-xs uppercase text-gray-500 mb-2">� Por Fecha</h3>
            <button
              onClick={() => setSelectedDate(null)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                !selectedDate ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Todas ({stats.total})
            </button>
            {dates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedDate === date ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                📅 {date} ({trendsByDate[date]?.length})
              </button>
            ))}

            <hr className="border-gray-700 my-4" />
            
            <h3 className="text-xs uppercase text-gray-500 mb-2">🏷️ Categorías</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                !selectedCategory ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              Todas
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, { label, emoji }]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedCategory === key ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {emoji} {label} ({stats.byCategory[key] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Cargando...</div>
          ) : viewMode === "learn" && learningContent ? (
            /* Learning View */
            <div className="space-y-4">
              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <h2 className="font-bold text-green-300 mb-2">📋 Resumen</h2>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">{learningContent.summary}</div>
              </div>
              
              {learningContent.content.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-bold text-white">
                    {CATEGORY_CONFIG[cat.category]?.emoji} {CATEGORY_CONFIG[cat.category]?.label}
                  </h3>
                  {cat.trends.map((trend, j) => (
                    <details key={j} className="bg-gray-900 border border-gray-700 rounded-lg p-3 hover:border-green-500/50">
                      <summary className="cursor-pointer font-medium">{trend.title}</summary>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="text-gray-300"><strong className="text-green-400">📝</strong> {trend.summary}</p>
                        <div><strong className="text-yellow-400">💡</strong> {trend.keyTakeaways?.join(" • ")}</div>
                        <div><strong className="text-blue-400">🎯</strong> {trend.practicalSteps?.join(" → ")}</div>
                        <div><strong className="text-pink-400">💰</strong> {trend.monetizationAngle}</div>
                        <div><strong className="text-purple-400">❓</strong> {trend.questionsToExplore?.join(" | ")}</div>
                      </div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          ) : filteredTrends.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">No hay tendencias</p>
              <button onClick={fetchNewTrends} className="px-4 py-2 bg-purple-600 rounded">
                🔍 Buscar ahora
              </button>
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredTrends.map((trend) => {
                const cat = CATEGORY_CONFIG[trend.category] || { label: trend.category, emoji: "📌", color: "gray" };
                const isExpanded = expandedTrend === trend.id;
                
                return (
                  <div
                    key={trend.id}
                    className={`bg-gray-900 border rounded-lg transition-colors cursor-pointer ${
                      isExpanded ? "border-purple-500" : "border-gray-800 hover:border-gray-600"
                    }`}
                    onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                  >
                    <div className="p-3 flex items-start gap-3">
                      {/* Heat Score */}
                      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-bold ${
                        trend.heatScore >= 75 ? "bg-orange-500/20 text-orange-400" :
                        trend.heatScore >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-700/50 text-gray-400"
                      }`}>
                        {trend.heatScore}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-1.5 py-0.5 bg-gray-800 rounded">
                            {cat.emoji} {cat.label}
                          </span>
                          <span className="text-xs text-gray-500">{trend.source}</span>
                        </div>
                        <h3 className="font-medium text-white truncate">{trend.title}</h3>
                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-400">{trend.description}</p>
                            {trend.url && (
                              <a 
                                href={trend.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block text-sm text-purple-400 hover:text-purple-300"
                              >
                                🔗 Ver fuente →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
