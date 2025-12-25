import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type ActiveView = "chat" | "trends" | "vault" | "academy";

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  activeView: ActiveView;
  commandPaletteOpen: boolean;
  
  // Active contexts
  activeProjectId: string | null;
  activeConversationId: string | null;
}

interface AppActions {
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
}

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      activeView: "chat",
      commandPaletteOpen: false,
      activeProjectId: null,
      activeConversationId: null,

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
    }),
    {
      name: "comfyclaude-app-store",
      // Only persist UI preferences, not transient state
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeProjectId: state.activeProjectId,
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
