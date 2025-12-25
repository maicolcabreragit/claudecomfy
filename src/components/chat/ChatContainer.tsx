"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, Message } from "ai/react";
import { cn } from "@/lib/utils";
import { ProgressBar, Phase } from "./ProgressBar";
import { Task } from "./TaskCard";
import { MessageList } from "./MessageList";
import { InputArea } from "./InputArea";

interface ChatContainerProps {
  knowledgeContext: string;
  projectId?: string | null;
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  className?: string;
}

// Type for messages from API
interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * ChatContainer - Main chat orchestrator
 * 
 * Manages all state, hooks, and business logic.
 * Composes MessageList and InputArea for rendering.
 */
export function ChatContainer({
  knowledgeContext,
  projectId,
  conversationId,
  onConversationCreated,
  className,
}: ChatContainerProps) {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Attachment state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Development flow state
  const [currentPhase, setCurrentPhase] = useState<Phase>("planning");
  const [sessionTasks, setSessionTasks] = useState<Map<string, Task[]>>(new Map());
  
  // Conversation tracking
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  // ================================================================
  // useChat hook with knowledgeContext + projectId
  // ================================================================
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      knowledgeContext: knowledgeContext,
      projectId: projectId,
    },
    onFinish: async (message) => {
      const convId = conversationId || pendingConversationId;
      if (convId) {
        await saveMessage(convId, message.role, message.content);
      }
    },
  });

  // ================================================================
  // Business Logic Functions
  // ================================================================
  
  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.conversation?.messages && data.conversation.messages.length > 0) {
        const loadedMessages: Message[] = data.conversation.messages.map((m: SavedMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function saveMessage(convId: string, role: string, content: string) {
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  }

  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    if (pendingConversationId) return pendingConversationId;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.conversation) {
        setPendingConversationId(data.conversation.id);
        onConversationCreated?.(data.conversation.id);
        return data.conversation.id;
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
    return null;
  }

  // ================================================================
  // Effects
  // ================================================================

  // Track previous conversationId for change detection
  const prevConversationIdRef = useRef<string | null | undefined>(undefined);
  
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    if (
      conversationId && 
      conversationId !== prevId && 
      conversationId !== pendingConversationId &&
      messages.length === 0
    ) {
      loadConversation(conversationId);
    }
    prevConversationIdRef.current = conversationId;
  }, [conversationId, pendingConversationId, messages.length]);

  // Poll for extension screenshots
  useEffect(() => {
    const pollScreenshots = async () => {
      try {
        const res = await fetch("/api/extension/screenshot");
        const data = await res.json();
        if (data.screenshots && data.screenshots.length > 0) {
          for (const ss of data.screenshots) {
            setPreviewUrls(prev => [...prev, ss.image]);
            const response = await fetch(ss.image);
            const blob = await response.blob();
            const file = new File([blob], `comfylink-${ss.id}.jpg`, { type: "image/jpeg" });
            setAttachments(prev => [...prev, file]);
          }
          console.log(`[ComfyLink] Added ${data.screenshots.length} screenshot(s) to chat`);
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const interval = setInterval(pollScreenshots, 2000);
    return () => clearInterval(interval);
  }, []);

  // Throttled auto-scroll
  const lastScrollRef = useRef<number>(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastScrollRef.current > 100) {
      lastScrollRef.current = now;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // ================================================================
  // Event Handlers
  // ================================================================

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    
    if (imageFiles.length > 0) {
      setAttachments((prev) => [...prev, ...imageFiles]);
      const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const namedFile = new File(
              [file],
              `pasted-image-${Date.now()}-${i}.${file.type.split("/")[1]}`,
              { type: file.type }
            );
            imageFiles.push(namedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        handleFileSelect(imageFiles as unknown as FileList);
      }
    },
    [handleFileSelect]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() && attachments.length === 0) return;
      if (isLoading) return;

      const currentInput = input;

      // Convert files to base64
      const imagePromises = attachments.map((file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      );

      const imageDataUrls = await Promise.all(imagePromises);
      
      // Clear attachments
      setAttachments([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);

      // Submit
      originalHandleSubmit(e, {
        experimental_attachments: imageDataUrls.map((url, i) => ({
          name: attachments[i]?.name || `image-${i}.png`,
          contentType: attachments[i]?.type || "image/png",
          url: url,
        })),
      });

      // Save to DB (non-blocking)
      try {
        const convId = await ensureConversation();
        if (convId) {
          await saveMessage(convId, "user", currentInput);
        }
      } catch (err) {
        console.error("Failed to persist message (non-critical):", err);
      }
    },
    [input, attachments, isLoading, originalHandleSubmit, previewUrls]
  );

  // Task handlers
  const handleTasksChange = useCallback((messageId: string, tasks: Task[]) => {
    setSessionTasks((prev) => new Map(prev).set(messageId, tasks));
    const allDecided = tasks.every((t) => t.status !== "pending");
    if (allDecided && tasks.length > 0) {
      setCurrentPhase("review");
    }
  }, []);

  const handleStartDevelopment = useCallback(() => {
    setCurrentPhase("development");
    
    const acceptedTasks: string[] = [];
    sessionTasks.forEach((tasks) => {
      tasks.filter(t => t.status === "accepted").forEach(t => {
        acceptedTasks.push(t.title);
      });
    });
    
    if (acceptedTasks.length > 0) {
      const devPrompt = `Procede a ejecutar las siguientes tareas que he aceptado:

${acceptedTasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Por favor, ejecuta cada tarea paso a paso. Después de completar cada una, espera mi confirmación antes de continuar con la siguiente.`;
      
      handleInputChange({ target: { value: devPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);
      setTimeout(() => {
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }, 100);
    }
  }, [sessionTasks, handleInputChange]);

  // ================================================================
  // Render
  // ================================================================

  return (
    <div
      ref={dropZoneRef}
      className={cn("flex flex-col h-full relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-accent-purple/20 border-2 border-dashed border-accent-purple flex items-center justify-center">
          <p className="text-accent-purple text-lg font-medium">
            Suelta la imagen aquí para análisis visual
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {sessionTasks.size > 0 && (
        <div className="border-b border-surface-border bg-surface-base">
          <ProgressBar currentPhase={currentPhase} />
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <MessageList
          messages={messages}
          sessionTasks={sessionTasks}
          isLoading={isLoading}
          error={error}
          hasContext={knowledgeContext.length > 0}
          onTasksChange={handleTasksChange}
          onStartDevelopment={handleStartDevelopment}
          onReload={reload}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Input Area */}
      <InputArea
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        onFileSelect={handleFileSelect}
        previewUrls={previewUrls}
        onRemoveAttachment={removeAttachment}
        isLoading={isLoading}
        hasAttachments={attachments.length > 0}
        hasKnowledgeContext={knowledgeContext.length > 0}
      />
    </div>
  );
}

// Re-export with original name for backwards compatibility
export { ChatContainer as ChatInterface };
