"use client";

import { useEffect } from "react";
import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { ThinkingBlock, extractThinking } from "./ThinkingBlock";
import { TaskList } from "./TaskList";
import { Task } from "./TaskCard";
import { parseTasksFromContent } from "@/lib/parse-tasks";

interface MessageBubbleProps {
  message: Message;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onStartDevelopment: () => void;
}

/**
 * MessageBubble - Individual message with markdown, thinking, and tasks
 */
export function MessageBubble({ 
  message, 
  tasks, 
  onTasksChange, 
  onStartDevelopment 
}: MessageBubbleProps) {
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
  const attachments = (message as Message & { 
    experimental_attachments?: Array<{ url: string; name: string }> 
  }).experimental_attachments;
  
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
