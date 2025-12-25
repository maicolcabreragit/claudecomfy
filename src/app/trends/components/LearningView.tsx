"use client";

import { type LearningData, CATEGORY_CONFIG } from "./types";

interface LearningViewProps {
  data: LearningData;
}

/**
 * LearningView - Analyzed content display with expandable sections
 */
export function LearningView({ data }: LearningViewProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 bg-semantic-success/10 border border-semantic-success/30 rounded-lg">
        <h2 className="font-bold text-semantic-success mb-2">📋 Resumen</h2>
        <div className="text-sm text-zinc-300 whitespace-pre-wrap">
          {data.summary}
        </div>
      </div>

      {/* Categories */}
      {data.content.map((cat, i) => (
        <div key={i} className="space-y-2">
          <h3 className="font-bold text-foreground">
            {CATEGORY_CONFIG[cat.category]?.emoji}{" "}
            {CATEGORY_CONFIG[cat.category]?.label || cat.category}
          </h3>
          {cat.trends.map((trend, j) => (
            <details
              key={j}
              className="bg-surface-base border border-surface-border rounded-lg p-3 hover:border-semantic-success/50"
            >
              <summary className="cursor-pointer font-medium">
                {trend.title}
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-zinc-300">
                  <strong className="text-semantic-success">📝</strong>{" "}
                  {trend.summary}
                </p>
                {trend.keyTakeaways?.length > 0 && (
                  <div>
                    <strong className="text-semantic-warning">💡</strong>{" "}
                    {trend.keyTakeaways.join(" • ")}
                  </div>
                )}
                {trend.practicalSteps?.length > 0 && (
                  <div>
                    <strong className="text-semantic-info">🎯</strong>{" "}
                    {trend.practicalSteps.join(" → ")}
                  </div>
                )}
                {trend.monetizationAngle && (
                  <div>
                    <strong className="text-pink-400">💰</strong>{" "}
                    {trend.monetizationAngle}
                  </div>
                )}
                {trend.questionsToExplore?.length > 0 && (
                  <div>
                    <strong className="text-accent-purple">❓</strong>{" "}
                    {trend.questionsToExplore.join(" | ")}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}
