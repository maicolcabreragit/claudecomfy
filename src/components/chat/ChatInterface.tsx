"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, Message } from "ai/react";
import { Send, Loader2, ImagePlus, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ThinkingBlock, extractThinking } from "./ThinkingBlock";
import { TaskList } from "./TaskList";
import { ProgressBar, Phase } from "./ProgressBar";
import { Task } from "./TaskCard";
import { parseTasksFromContent } from "@/lib/parse-tasks";

interface ChatInterfaceProps {
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
 * Main Chat Interface Component
 * 
 * Uses useChat hook with knowledgeContext wired into request body.
 * Supports image drag-and-drop for vision capabilities.
 * Persists messages to database when conversationId is provided.
 */
export function ChatInterface({
  knowledgeContext,
  projectId,
  conversationId,
  onConversationCreated,
  className,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Image attachments state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Development flow state
  const [currentPhase, setCurrentPhase] = useState<Phase>("planning");
  const [sessionTasks, setSessionTasks] = useState<Map<string, Task[]>>(new Map());
  
  // Track if we need to create a conversation
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  // ================================================================
  // CRITICAL WIRING: useChat with knowledgeContext + projectId in body
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
    // CRITICAL: Pass knowledgeContext and projectId to the API route
    body: {
      knowledgeContext: knowledgeContext,
      projectId: projectId,
    },
    // Save assistant messages to DB when received
    onFinish: async (message) => {
      const convId = conversationId || pendingConversationId;
      if (convId) {
        await saveMessage(convId, message.role, message.content);
      }
    },
  });

  // Track previous conversationId to detect when switching conversations
  const prevConversationIdRef = useRef<string | null | undefined>(undefined);
  
  // Load existing messages ONLY when switching to a DIFFERENT existing conversation
  // NOT when creating a new one (pendingConversationId handles that)
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    
    // Only load if:
    // 1. We have a conversationId
    // 2. It's different from the previous one
    // 3. It's NOT the same as pendingConversationId (meaning it's an existing conversation selected from sidebar)
    // 4. We don't have messages yet
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
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }

  // Poll for extension screenshots
  useEffect(() => {
    const pollScreenshots = async () => {
      try {
        const res = await fetch("/api/extension/screenshot");
        const data = await res.json();
        if (data.screenshots && data.screenshots.length > 0) {
          // Convert base64 screenshots to preview URLs and add to attachments
          for (const ss of data.screenshots) {
            setPreviewUrls(prev => [...prev, ss.image]);
            // Create a blob from base64 for the attachment
            const response = await fetch(ss.image);
            const blob = await response.blob();
            const file = new File([blob], `comfylink-${ss.id}.jpg`, { type: "image/jpeg" });
            setAttachments(prev => [...prev, file]);
          }
          console.log(`[ComfyLink] Added ${data.screenshots.length} screenshot(s) to chat`);
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    };

    const interval = setInterval(pollScreenshots, 2000);
    return () => clearInterval(interval);
  }, []);

  async function saveMessage(convId: string, role: string, content: string) {
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    } catch (error) {
      console.error("Failed to save message:", error);
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
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
    return null;
  }

  // Throttled auto-scroll (only scroll every 100ms max to reduce jank)
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

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    
    if (imageFiles.length > 0) {
      setAttachments((prev) => [...prev, ...imageFiles]);
      
      // Create preview URLs
      const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Drag and drop handlers
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

  // Paste handler for images (Ctrl+V)
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
            // Create a named file from the clipboard
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

  // Custom submit handler with attachments and persistence (non-blocking)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() && attachments.length === 0) return;
      if (isLoading) return;

      // Store the current input before clearing
      const currentInput = input;

      // Convert files to base64 for experimental_attachments
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

      // Submit immediately (don't wait for persistence)
      originalHandleSubmit(e, {
        experimental_attachments: imageDataUrls.map((url, i) => ({
          name: attachments[i]?.name || `image-${i}.png`,
          contentType: attachments[i]?.type || "image/png",
          url: url,
        })),
      });

      // Save to DB in background (non-blocking)
      try {
        const convId = await ensureConversation();
        if (convId) {
          await saveMessage(convId, "user", currentInput);
        }
      } catch (error) {
        console.error("Failed to persist message (non-critical):", error);
      }
    },
    [input, attachments, isLoading, originalHandleSubmit, previewUrls, conversationId, pendingConversationId, projectId, onConversationCreated]
  );

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
        <div className="absolute inset-0 z-50 bg-purple-500/20 border-2 border-dashed border-purple-500 flex items-center justify-center">
          <p className="text-purple-300 text-lg font-medium">
            Suelta la imagen aquí para análisis visual
          </p>
        </div>
      )}

      {/* Progress Bar - Solo visible cuando hay tareas detectadas */}
      {sessionTasks.size > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/50">
          <ProgressBar currentPhase={currentPhase} />
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState hasContext={knowledgeContext.length > 0} />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                tasks={sessionTasks.get(message.id) || []}
                onTasksChange={(tasks) => {
                  setSessionTasks((prev) => new Map(prev).set(message.id, tasks));
                  // Auto-advance phase when tasks are decided
                  const allDecided = tasks.every((t) => t.status !== "pending");
                  if (allDecided && tasks.length > 0) {
                    setCurrentPhase("review");
                  }
                }}
                onStartDevelopment={() => {
                  setCurrentPhase("development");
                  
                  // Get all accepted tasks from all messages
                  const acceptedTasks: string[] = [];
                  sessionTasks.forEach((tasks) => {
                    tasks.filter(t => t.status === "accepted").forEach(t => {
                      acceptedTasks.push(t.title);
                    });
                  });
                  
                  if (acceptedTasks.length > 0) {
                    // Create a development prompt
                    const devPrompt = `Procede a ejecutar las siguientes tareas que he aceptado:

${acceptedTasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Por favor, ejecuta cada tarea paso a paso. Después de completar cada una, espera mi confirmación antes de continuar con la siguiente.`;
                    
                    // Trigger the submit with the development prompt
                    handleInputChange({ target: { value: devPrompt } } as React.ChangeEvent<HTMLTextAreaElement>);
                    // Small delay to ensure state updates, then submit
                    setTimeout(() => {
                      const form = document.querySelector("form");
                      if (form) {
                        form.requestSubmit();
                      }
                    }, 100);
                  }
                }}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Claude está pensando...</span>
              </div>
            )}
            
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-300">{error.message}</p>
                <button
                  onClick={() => reload()}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Try again
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-zinc-800 p-4">
        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="h-16 w-16 object-cover rounded-lg border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              placeholder={
                attachments.length > 0
                  ? "Describe o pregunta sobre estas imágenes..."
                  : "Escribe un mensaje..."
              }
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-zinc-700",
                "bg-zinc-800/50 px-4 py-3 pr-12",
                "text-zinc-100 placeholder:text-zinc-500",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                "min-h-[48px] max-h-[200px]"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onPaste={handlePaste}
            />
            
            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "absolute right-12 bottom-3 p-1 transition-colors",
                attachments.length > 0
                  ? "text-purple-400 hover:text-purple-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              title="Upload image for vision analysis"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className={cn(
              "p-3 rounded-xl bg-purple-600 text-white",
              "hover:bg-purple-500 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        
        {/* Context indicator */}
        {knowledgeContext.length > 0 && (
          <div className="max-w-3xl mx-auto mt-2 flex items-center gap-1 text-xs text-purple-400">
            <Sparkles className="h-3 w-3" />
            <span>Contexto de conocimiento activo</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state when no messages
 */
function EmptyState({ hasContext }: { hasContext: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
        ComfyClaude OS
      </h1>
      <p className="text-zinc-500 max-w-md">
        Tu interfaz Claude optimizada en costes con inyección de conocimiento y razonamiento extendido.
      </p>
      <p className="text-zinc-600 text-sm mt-2">
        Arrastra y suelta imágenes para análisis visual
      </p>
      {hasContext && (
        <div className="mt-4 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm">
          ✓ Contexto de conocimiento cargado
        </div>
      )}
    </div>
  );
}

/**
 * Individual message bubble with markdown, thinking extraction, and task detection
 */
interface MessageBubbleProps {
  message: Message;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartDevelopment: () => void;
}

function MessageBubble({ message, tasks, onTasksChange, onStartDevelopment }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const rawContent = message.content || "";
  
  // Extract thinking and parse tasks
  const { thinking, content } = isUser
    ? { thinking: "", content: rawContent }
    : extractThinking(rawContent);
  
  // Parse tasks from assistant messages
  const { tasks: parsedTasks, cleanedContent } = isUser
    ? { tasks: [], cleanedContent: content }
    : parseTasksFromContent(content);
  
  // Check for experimental_attachments (images)
  const attachments = (message as Message & { experimental_attachments?: Array<{ url: string; name: string }> }).experimental_attachments;
  
  // Determine display
  const showTaskList = !isUser && tasks.length > 0;
  const displayContent = showTaskList ? cleanedContent : content;

  // Initialize tasks if not already set and we detected tasks
  useEffect(() => {
    if (!isUser && parsedTasks.length > 0 && tasks.length === 0) {
      onTasksChange(parsedTasks);
    }
  }, [isUser, parsedTasks, tasks.length, onTasksChange]);

  return (
    <div
      className={cn(
        "flex flex-col message-bubble",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Role label */}
      <div
        className={cn(
          "text-sm font-semibold mb-2 flex items-center gap-2",
          isUser ? "text-purple-400" : "text-gradient"
        )}
      >
        {isUser ? "Tú" : "✨ ComfyClaude"}
      </div>

      {/* Attached images (user messages) */}
      {isUser && attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((attachment, index) => (
            <img
              key={index}
              src={attachment.url}
              alt={attachment.name}
              className="max-h-48 rounded-lg border border-zinc-700"
            />
          ))}
        </div>
      )}

      {/* Thinking block (assistant only) */}
      {!isUser && thinking && (
        <ThinkingBlock content={thinking} className="w-full max-w-full" />
      )}

      {/* Message content */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-full",
          isUser
            ? "bg-purple-600 text-white"
            : "bg-zinc-800 text-zinc-100 border border-zinc-700"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom code block styling
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-zinc-700 text-purple-300 text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 overflow-x-auto">
                      <code className={cn("text-sm", className)} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                // Style links
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Task List (when tasks detected in assistant message) */}
      {showTaskList && (
        <div className="w-full mt-3">
          <TaskList
            tasks={tasks}
            onTasksChange={onTasksChange}
            onStartDevelopment={onStartDevelopment}
          />
        </div>
      )}
    </div>
  );
}
