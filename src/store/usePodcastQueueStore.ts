/**
 * Podcast Episode Queue Store
 * 
 * Manages the queue of trends selected for the next podcast episode.
 * Persists to localStorage for session continuity.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QueuedTrend {
  id: string;
  title: string;
  description: string;
  category: string;
  heatScore: number;
  addedAt: number; // timestamp
}

interface PodcastQueueState {
  // Queue of trends for next episode
  queue: QueuedTrend[];
  
  // Track which trends have been used in published episodes
  usedTrendIds: Set<string>;
  
  // Estimated duration based on queue size
  estimatedDuration: number; // seconds
}

interface PodcastQueueActions {
  // Queue management
  addToQueue: (trend: QueuedTrend) => void;
  removeFromQueue: (trendId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  
  // Check status
  isInQueue: (trendId: string) => boolean;
  isUsed: (trendId: string) => boolean;
  
  // Mark trends as used
  markAsUsed: (trendIds: string[]) => void;
  
  // Get queue as array of IDs
  getQueueIds: () => string[];
}

// Average duration per trend ~2-3 minutes
const DURATION_PER_TREND = 150; // seconds

export const usePodcastQueueStore = create<PodcastQueueState & PodcastQueueActions>()(
  persist(
    (set, get) => ({
      queue: [],
      usedTrendIds: new Set(),
      estimatedDuration: 0,

      addToQueue: (trend) => {
        const { queue } = get();
        
        // Don't add duplicates
        if (queue.some(t => t.id === trend.id)) return;
        
        // Max 5 trends per episode
        if (queue.length >= 5) return;

        set({
          queue: [...queue, { ...trend, addedAt: Date.now() }],
          estimatedDuration: (queue.length + 1) * DURATION_PER_TREND,
        });
      },

      removeFromQueue: (trendId) => {
        const { queue } = get();
        const newQueue = queue.filter(t => t.id !== trendId);
        set({
          queue: newQueue,
          estimatedDuration: newQueue.length * DURATION_PER_TREND,
        });
      },

      reorderQueue: (startIndex, endIndex) => {
        const { queue } = get();
        const result = Array.from(queue);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        set({ queue: result });
      },

      clearQueue: () => set({ queue: [], estimatedDuration: 0 }),

      isInQueue: (trendId) => {
        return get().queue.some(t => t.id === trendId);
      },

      isUsed: (trendId) => {
        return get().usedTrendIds.has(trendId);
      },

      markAsUsed: (trendIds) => {
        const { usedTrendIds } = get();
        const newUsed = new Set(usedTrendIds);
        trendIds.forEach(id => newUsed.add(id));
        set({ usedTrendIds: newUsed });
      },

      getQueueIds: () => {
        return get().queue.map(t => t.id);
      },
    }),
    {
      name: "comfyclaude-podcast-queue",
      // Custom serializer to handle Set
      partialize: (state) => ({
        queue: state.queue,
        usedTrendIds: Array.from(state.usedTrendIds),
        estimatedDuration: state.estimatedDuration,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        usedTrendIds: new Set(persistedState?.usedTrendIds || []),
      }),
    }
  )
);

// Selectors
export const useQueueCount = () =>
  usePodcastQueueStore((state) => state.queue.length);

export const useEstimatedDuration = () =>
  usePodcastQueueStore((state) => state.estimatedDuration);

export const useCanGenerateEpisode = () =>
  usePodcastQueueStore((state) => state.queue.length >= 2);
