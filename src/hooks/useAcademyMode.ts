"use client";

import { useState, useEffect, useCallback } from "react";

interface LessonStep {
  id: string;
  title: string;
  completed: boolean;
}

interface ActiveLesson {
  id: string;
  number: number;
  title: string;
  description?: string;
  steps: LessonStep[];
  resourceUrl?: string;
}

interface ActiveCourse {
  id: string;
  title: string;
  progress: number;
  currentLesson: number;
  totalLessons: number;
}

interface AcademyModeState {
  isActive: boolean;
  course: ActiveCourse | null;
  lesson: ActiveLesson | null;
}

/**
 * useAcademyMode - Hook to manage Academy/Course mode state
 * 
 * Handles:
 * - Detecting if a course is active (from URL or projectId)
 * - Loading course and lesson data
 * - Persisting progress to API
 * - Generating contextual suggestions
 */
export function useAcademyMode(moduleId?: string | null) {
  const [state, setState] = useState<AcademyModeState>({
    isActive: false,
    course: null,
    lesson: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load module data when moduleId changes
  useEffect(() => {
    if (!moduleId) {
      setState({ isActive: false, course: null, lesson: null });
      return;
    }

    loadModuleData(moduleId);
  }, [moduleId]);

  const loadModuleData = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/academy/modules/${id}`);
      if (!res.ok) {
        setState({ isActive: false, course: null, lesson: null });
        return;
      }

      const data = await res.json();
      
      // Transform API data to our state shape
      const units = data.units || [];
      const completedUnits = units.filter((u: { completed: boolean }) => u.completed).length;
      const currentUnitIndex = units.findIndex((u: { completed: boolean }) => !u.completed);
      const currentUnit = units[currentUnitIndex >= 0 ? currentUnitIndex : 0];

      setState({
        isActive: true,
        course: {
          id: data.id,
          title: data.title,
          progress: data.progress || Math.round((completedUnits / units.length) * 100),
          currentLesson: currentUnitIndex >= 0 ? currentUnitIndex + 1 : units.length,
          totalLessons: units.length,
        },
        lesson: currentUnit ? {
          id: currentUnit.id,
          number: currentUnitIndex + 1,
          title: currentUnit.title,
          description: currentUnit.description,
          steps: currentUnit.steps || [
            { id: "1", title: "Leer la introducción", completed: false },
            { id: "2", title: "Ver el ejemplo", completed: false },
            { id: "3", title: "Practicar", completed: false },
          ],
          resourceUrl: currentUnit.resourceUrl,
        } : null,
      });
    } catch (error) {
      console.error("Failed to load module:", error);
      setState({ isActive: false, course: null, lesson: null });
    } finally {
      setIsLoading(false);
    }
  };

  const exitCourse = useCallback(() => {
    setState({ isActive: false, course: null, lesson: null });
  }, []);

  const completeStep = useCallback(async (stepId: string, completed: boolean) => {
    if (!state.lesson) return;

    // Optimistic update
    setState(prev => ({
      ...prev,
      lesson: prev.lesson ? {
        ...prev.lesson,
        steps: prev.lesson.steps.map(s =>
          s.id === stepId ? { ...s, completed } : s
        ),
      } : null,
    }));

    // Persist to API (fire and forget)
    try {
      await fetch(`/api/academy/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: state.course?.id,
          lessonId: state.lesson.id,
          stepId,
          completed,
        }),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [state.lesson, state.course?.id]);

  const completeLesson = useCallback(async () => {
    if (!state.course || !state.lesson) return;

    try {
      await fetch(`/api/academy/lessons/${state.lesson.id}/complete`, {
        method: "POST",
      });
      
      // Reload to get next lesson
      await loadModuleData(state.course.id);
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    }
  }, [state.course, state.lesson]);

  const nextLesson = useCallback(async () => {
    if (!state.course) return;
    await loadModuleData(state.course.id);
  }, [state.course]);

  return {
    ...state,
    isLoading,
    exitCourse,
    completeStep,
    completeLesson,
    nextLesson,
  };
}
