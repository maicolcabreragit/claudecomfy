"use client";

import { useState, useEffect } from "react";

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

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  FLUX_TECHNIQUES: { label: "Técnicas Flux", emoji: "🎨" },
  LORA_MODELS: { label: "LoRA Models", emoji: "🧠" },
  MONETIZATION: { label: "Monetización", emoji: "💰" },
  ANTI_DETECTION: { label: "Anti-Detección", emoji: "🔒" },
  TOOLS: { label: "Herramientas", emoji: "🛠️" },
  NEWS: { label: "Noticias", emoji: "📰" },
};

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadTrends = async () => {
    try {
      const url = selectedCategory 
        ? `/api/trends?category=${selectedCategory}` 
        : "/api/trends";
      const res = await fetch(url);
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
      alert(`✅ ${data.message}`);
      loadTrends();
    } catch (error) {
      alert("Error fetching trends");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              📡 Trend Radar
            </h1>
            <p className="text-gray-400 mt-1">Tendencias AI Models & Monetización</p>
          </div>
          <button
            onClick={fetchNewTrends}
            disabled={fetching}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            {fetching ? "Buscando..." : "🔄 Actualizar"}
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !selectedCategory ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Todas
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === key ? "bg-purple-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Trends Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-10">Cargando...</div>
        ) : trends.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-4">No hay tendencias aún</p>
            <button
              onClick={fetchNewTrends}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              🔍 Buscar tendencias
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trends.map((trend) => {
              const cat = CATEGORY_LABELS[trend.category] || { label: trend.category, emoji: "📌" };
              return (
                <div
                  key={trend.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-900/50 rounded-full">
                          {cat.emoji} {cat.label}
                        </span>
                        <span className="text-xs text-gray-500">{trend.source}</span>
                        <span className="text-xs px-2 py-0.5 bg-orange-900/50 rounded-full">
                          🔥 {trend.heatScore}
                        </span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{trend.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{trend.description}</p>
                    </div>
                  </div>
                  {trend.url && (
                    <a
                      href={trend.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      Ver más →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
