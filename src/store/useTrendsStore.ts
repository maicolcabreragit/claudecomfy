import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type TrendCategory =
  | "FLUX_TECHNIQUES"
  | "LORA_MODELS"
  | "MONETIZATION"
  | "ANTI_DETECTION"
  | "TOOLS"
  | "NEWS";

export interface Trend {
  id: string;
  title: string;
  description: string;
  url: string | null;
  source: string;
  category: TrendCategory;
  heatScore: number;
  keywords: string[];
  publishedAt: string | null;
  fetchedAt: string;
}

export interface TrendFilters {
  category: TrendCategory | null;
  dateRange: "today" | "week" | "month" | "all";
  minScore: number;
  searchQuery: string;
}

interface TrendsState {
  // Data
  trends: Trend[];
  
  // Selection
  selectedTrendId: string | null;
  expandedTrendId: string | null;
  
  // Filters
  filters: TrendFilters;
  
  // Loading
  isLoading: boolean;
  error: string | null;
  
  // Analysis
  currentAnalysis: string | null;
  isGeneratingAnalysis: boolean;
}

interface TrendsActions {
  // Data
  setTrends: (trends: Trend[]) => void;
  addTrend: (trend: Trend) => void;
  
  // Selection
  selectTrend: (id: string | null) => void;
  expandTrend: (id: string | null) => void;
  
  // Filters
  setFilter: <K extends keyof TrendFilters>(
    key: K,
    value: TrendFilters[K]
  ) => void;
  setFilters: (filters: Partial<TrendFilters>) => void;
  clearFilters: () => void;
  
  // Loading
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Analysis
  setCurrentAnalysis: (analysis: string | null) => void;
  setIsGeneratingAnalysis: (generating: boolean) => void;
}

const defaultFilters: TrendFilters = {
  category: null,
  dateRange: "all",
  minScore: 0,
  searchQuery: "",
};

// ============================================================================
// Store
// ============================================================================

export const useTrendsStore = create<TrendsState & TrendsActions>()(
  persist(
    (set) => ({
      // Initial state
      trends: [],
      selectedTrendId: null,
      expandedTrendId: null,
      filters: defaultFilters,
      isLoading: false,
      error: null,
      currentAnalysis: null,
      isGeneratingAnalysis: false,

      // Data actions
      setTrends: (trends) => set({ trends }),
      addTrend: (trend) =>
        set((state) => ({ trends: [trend, ...state.trends] })),

      // Selection actions
      selectTrend: (selectedTrendId) => set({ selectedTrendId }),
      expandTrend: (expandedTrendId) => set({ expandedTrendId }),

      // Filter actions
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      clearFilters: () => set({ filters: defaultFilters }),

      // Loading actions
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Analysis actions
      setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
      setIsGeneratingAnalysis: (isGeneratingAnalysis) =>
        set({ isGeneratingAnalysis }),
    }),
    {
      name: "comfyclaude-trends-store",
      // Only persist filters
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useTrends = () => useTrendsStore((state) => state.trends);

export const useSelectedTrend = () =>
  useTrendsStore((state) =>
    state.selectedTrendId
      ? state.trends.find((t) => t.id === state.selectedTrendId) || null
      : null
  );

export const useTrendFilters = () =>
  useTrendsStore((state) => state.filters);

export const useFilteredTrends = () =>
  useTrendsStore((state) => {
    let filtered = state.trends;
    const { category, dateRange, minScore, searchQuery } = state.filters;

    // Filter by category
    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }

    // Filter by score
    if (minScore > 0) {
      filtered = filtered.filter((t) => t.heatScore >= minScore);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }

    // Filter by date
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateRange) {
        case "today":
          cutoff.setDate(now.getDate() - 1);
          break;
        case "week":
          cutoff.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (t) => new Date(t.fetchedAt) >= cutoff
      );
    }

    return filtered;
  });

export const useTrendsLoading = () =>
  useTrendsStore((state) => state.isLoading);

export const useTrendsError = () =>
  useTrendsStore((state) => state.error);
