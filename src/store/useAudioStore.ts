import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

interface AudioState {
  // Current track
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number; // 0-100
  volume: number; // 0-100
  
  // Queue (future)
  queue: AudioTrack[];
}

interface AudioActions {
  // Playback
  setTrack: (track: AudioTrack | null) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  
  // Queue
  addToQueue: (track: AudioTrack) => void;
  clearQueue: () => void;
  
  // Convenience
  playTrack: (track: AudioTrack) => void;
  stop: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAudioStore = create<AudioState & AudioActions>()((set) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 80,
  queue: [],

  // Playback actions
  setTrack: (track) => set({ currentTrack: track, progress: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),

  // Queue actions
  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),
  clearQueue: () => set({ queue: [] }),

  // Convenience actions
  playTrack: (track) =>
    set({ currentTrack: track, isPlaying: true, progress: 0 }),
  stop: () =>
    set({ currentTrack: null, isPlaying: false, progress: 0 }),
}));

// ============================================================================
// Selectors
// ============================================================================

export const useCurrentTrack = () =>
  useAudioStore((state) => state.currentTrack);

export const useIsPlaying = () =>
  useAudioStore((state) => state.isPlaying);

export const useAudioProgress = () =>
  useAudioStore((state) => state.progress);

export const useAudioVolume = () =>
  useAudioStore((state) => state.volume);
