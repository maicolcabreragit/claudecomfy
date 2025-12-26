// Zustand Stores - Centralized exports

// App Store (main UI state)
export {
  useAppStore,
  useSidebarCollapsed,
  useActiveView,
  useCommandPaletteOpen,
  useActiveProject,
  useActiveConversation,
  useActiveCourse,
  useIsInCourseMode,
  type ActiveView,
  type ActiveCourse,
} from "./useAppStore";

// Chat Store
export {
  useChatStore,
  useChatMessages,
  useChatInput,
  useChatAttachments,
  useChatLoading,
  useChatStreaming,
  useChatError,
  useChatConversationId,
  type ChatMessage,
  type ChatAttachment,
} from "./useChatStore";

// Trends Store
export {
  useTrendsStore,
  useTrends,
  useSelectedTrend,
  useTrendFilters,
  useFilteredTrends,
  useTrendsLoading,
  useTrendsError,
  type Trend,
  type TrendCategory,
  type TrendFilters,
} from "./useTrendsStore";

// Audio Store
export {
  useAudioStore,
  useCurrentTrack,
  useIsPlaying,
  useAudioProgress,
  useAudioVolume,
} from "./useAudioStore";
