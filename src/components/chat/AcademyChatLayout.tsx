"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChatContainer } from "./ChatContainer";
import { AcademyModeBar } from "./AcademyModeBar";
import { LessonPanel } from "./LessonPanel";
import { CourseSuggestions, generateLessonSuggestions } from "./CourseSuggestions";
import { useAcademyMode } from "@/hooks/useAcademyMode";

interface AcademyChatLayoutProps {
  moduleId?: string | null;
  knowledgeContext?: string;
  conversationId?: string | null;
  onConversationCreated?: (id: string) => void;
}

/**
 * AcademyChatLayout - Wrapper that adds Academy mode UI to ChatContainer
 * 
 * When a moduleId is provided, shows:
 * - AcademyModeBar instead of TopBar
 * - LessonPanel on the right
 * - CourseSuggestions above input
 */
export function AcademyChatLayout({
  moduleId,
  knowledgeContext = "",
  conversationId,
  onConversationCreated,
}: AcademyChatLayoutProps) {
  const {
    isActive,
    course,
    lesson,
    isLoading,
    exitCourse,
    completeStep,
    completeLesson,
    nextLesson,
  } = useAcademyMode(moduleId);

  const [inputValue, setInputValue] = useState("");

  // Generate suggestions based on lesson context
  const suggestions = lesson
    ? generateLessonSuggestions(
        lesson.title,
        lesson.steps.filter(s => s.completed).map(s => s.id),
        lesson.steps.find(s => !s.completed)?.title
      )
    : [];

  const handleSuggestionSelect = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  // If not in academy mode, render normal chat
  if (!isActive || !course) {
    return (
      <ChatContainer
        knowledgeContext={knowledgeContext}
        conversationId={conversationId}
        onConversationCreated={onConversationCreated}
        className="h-full"
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Academy Mode Bar - replaces TopBar */}
      <AcademyModeBar course={course} onExit={exitCourse} />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Suggestions (positioned above chat but inside container) */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-b border-border-subtle bg-surface-base/50">
              <CourseSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          )}

          {/* Chat with lesson context */}
          <ChatContainer
            knowledgeContext={`
${knowledgeContext}

[CONTEXTO DE LECCIÓN ACTIVA]
Curso: ${course.title}
Lección ${lesson?.number || 1}: ${lesson?.title || ""}
${lesson?.description || ""}

Pasos de la lección:
${lesson?.steps.map((s, i) => `${s.completed ? "✅" : "⬜"} ${i + 1}. ${s.title}`).join("\n") || ""}

El usuario está aprendiendo este tema. Proporciona explicaciones claras, ejemplos prácticos, y guía paso a paso cuando corresponda.
            `.trim()}
            conversationId={conversationId}
            onConversationCreated={onConversationCreated}
            className="flex-1"
          />
        </div>

        {/* Lesson Panel - right side */}
        {lesson && (
          <LessonPanel
            lesson={lesson}
            totalLessons={course.totalLessons}
            onStepComplete={completeStep}
            onLessonComplete={completeLesson}
            onNextLesson={nextLesson}
          />
        )}
      </div>
    </div>
  );
}
