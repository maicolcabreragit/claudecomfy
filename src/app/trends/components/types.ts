/**
 * Shared types for Trends page components
 */

export interface Trend {
  id: string;
  title: string;
  description: string;
  url: string | null;
  source: string;
  category: string;
  heatScore: number;
  fetchedAt: string;
}

export interface LearningTrend {
  title: string;
  url: string;
  summary: string;
  keyTakeaways: string[];
  practicalSteps: string[];
  monetizationAngle: string;
  questionsToExplore: string[];
}

export interface LearningData {
  summary: string;
  content: Array<{
    category: string;
    trends: LearningTrend[];
  }>;
}

export const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  FLUX_TECHNIQUES: { label: "Flux", emoji: "🎨", color: "purple" },
  LORA_MODELS: { label: "LoRA", emoji: "🧠", color: "blue" },
  MONETIZATION: { label: "Dinero", emoji: "💰", color: "green" },
  ANTI_DETECTION: { label: "Stealth", emoji: "🔒", color: "red" },
  TOOLS: { label: "Tools", emoji: "🛠️", color: "orange" },
  NEWS: { label: "News", emoji: "📰", color: "pink" },
};
