import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type ActiveView = "chat" | "trends" | "vault" | "academy";

export interface ActiveCourse {
  id: string;
  name: string;
  currentLesson: number;
  totalLessons: number;
  progress: number;
}

interface AppState {
  // User
  userId: string | null;
  
  // UI State
  sidebarCollapsed: boolean;
  activeView: ActiveView;
  commandPaletteOpen: boolean;
  
  // Active contexts
  activeProjectId: string | null;
  activeConversationId: string | null;
  
  // Academy mode
  activeCourse: ActiveCourse | null;
}

interface AppActions {
  // User
  setUserId: (userId: string | null) => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Navigation
  setActiveView: (view: ActiveView) => void;
  
  // Command Palette
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Context
  setActiveProject: (projectId: string | null) => void;
  setActiveConversation: (conversationId: string | null) => void;
  
  // Academy mode
  setActiveCourse: (course: ActiveCourse | null) => void;
  updateCourseProgress: (progress: number, currentLesson?: number) => void;
  exitCourse: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // Initial state
      userId: null,
      sidebarCollapsed: false,
      activeView: "chat",
      commandPaletteOpen: false,
      activeProjectId: null,
      activeConversationId: null,
      activeCourse: null,

      // User actions
      setUserId: (userId) => set({ userId }),

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      // Navigation actions
      setActiveView: (view) => set({ activeView: view }),

      // Command Palette actions
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // Context actions
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      setActiveConversation: (conversationId) =>
        set({ activeConversationId: conversationId }),

      // Academy mode actions
      setActiveCourse: (course) => set({ activeCourse: course }),
      updateCourseProgress: (progress, currentLesson) =>
        set((state) => ({
          activeCourse: state.activeCourse
            ? {
                ...state.activeCourse,
                progress,
                currentLesson: currentLesson ?? state.activeCourse.currentLesson,
              }
            : null,
        })),
      exitCourse: () => set({ activeCourse: null }),
    }),
    {
      name: "comfyclaude-app-store",
      // Only persist UI preferences, not transient state
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeProjectId: state.activeProjectId,
        activeCourse: state.activeCourse,
      }),
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const useSidebarCollapsed = () =>
  useAppStore((state) => state.sidebarCollapsed);

export const useActiveView = () =>
  useAppStore((state) => state.activeView);

export const useCommandPaletteOpen = () =>
  useAppStore((state) => state.commandPaletteOpen);

export const useActiveProject = () =>
  useAppStore((state) => state.activeProjectId);

export const useActiveConversation = () =>
  useAppStore((state) => state.activeConversationId);

export const useActiveCourse = () =>
  useAppStore((state) => state.activeCourse);

export const useIsInCourseMode = () =>
  useAppStore((state) => state.activeCourse !== null);
