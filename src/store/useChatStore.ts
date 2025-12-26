import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  attachments?: Array<{ url: string; name: string }>;
}

export interface ChatAttachment {
  file: File;
  previewUrl: string;
}

interface ChatState {
  // Messages
  messages: ChatMessage[];
  
  // Input
  input: string;
  attachments: ChatAttachment[];
  
  // Loading states
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Context
  conversationId: string | null;
  knowledgeContext: string;
}

interface ChatActions {
  // Messages
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  
  // Input
  setInput: (input: string) => void;
  clearInput: () => void;
  
  // Attachments
  addAttachment: (file: File) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  
  // Loading
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  
  // Context
  setConversationId: (id: string | null) => void;
  setKnowledgeContext: (context: string) => void;
  
  // Reset
  resetChat: () => void;
}

const initialState: ChatState = {
  messages: [],
  input: "",
  attachments: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  conversationId: null,
  knowledgeContext: "",
};

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,

  // Messages
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  // Input
  setInput: (input) => set({ input }),
  clearInput: () => set({ input: "" }),

  // Attachments
  addAttachment: (file) => {
    const previewUrl = URL.createObjectURL(file);
    set((state) => ({
      attachments: [...state.attachments, { file, previewUrl }],
    }));
  },
  removeAttachment: (index) => {
    const attachments = get().attachments;
    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(attachments[index].previewUrl);
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
    }));
  },
  clearAttachments: () => {
    // Revoke all URLs
    get().attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    set({ attachments: [] });
  },

  // Loading
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error }),

  // Context
  setConversationId: (conversationId) => set({ conversationId }),
  setKnowledgeContext: (knowledgeContext) => set({ knowledgeContext }),

  // Reset
  resetChat: () => {
    // Clean up attachments
    get().attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const useChatMessages = () =>
  useChatStore((state) => state.messages);

export const useChatInput = () =>
  useChatStore((state) => state.input);

export const useChatAttachments = () =>
  useChatStore((state) => state.attachments);

export const useChatLoading = () =>
  useChatStore((state) => state.isLoading);

export const useChatStreaming = () =>
  useChatStore((state) => state.isStreaming);

export const useChatError = () =>
  useChatStore((state) => state.error);

export const useChatConversationId = () =>
  useChatStore((state) => state.conversationId);
