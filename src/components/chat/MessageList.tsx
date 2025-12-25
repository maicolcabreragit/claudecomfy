"use client";

import * as React from "react";
import { Message } from "ai/react";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";
import { Task } from "./TaskCard";

interface MessageListProps {
  messages: Message[];
  sessionTasks: Map<string, Task[]>;
  isLoading: boolean;
  error: Error | null;
  hasContext: boolean;
  onTasksChange: (messageId: string, tasks: Task[]) => void;
  onStartDevelopment: () => void;
  onReload: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * MessageList - Displays messages or empty state
 */
export function MessageList({
  messages,
  sessionTasks,
  isLoading,
  error,
  hasContext,
  onTasksChange,
  onStartDevelopment,
  onReload,
  messagesEndRef,
}: MessageListProps) {
  if (messages.length === 0) {
    return <EmptyState hasContext={hasContext} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          tasks={sessionTasks.get(message.id) || []}
          onTasksChange={(tasks) => onTasksChange(message.id, tasks)}
          onStartDevelopment={onStartDevelopment}
        />
      ))}
      
      {isLoading && (
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Claude está pensando...</span>
        </div>
      )}
      
      {error && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/30">
          <p className="text-sm text-semantic-error">{error.message}</p>
          <button
            onClick={onReload}
            className="mt-2 text-xs text-semantic-error hover:text-semantic-error/80"
          >
            Try again
          </button>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
