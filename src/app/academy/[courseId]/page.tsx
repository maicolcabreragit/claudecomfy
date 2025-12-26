"use client";

import { useParams } from "next/navigation";
import { 
  GraduationCap, 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Clock,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout";

// Mock course data - in production this would come from API/DB
const COURSES: Record<string, {
  title: string;
  description: string;
  lessons: { id: string; title: string; duration: string; completed: boolean }[];
  progress: number;
}> = {
  "comfyui-basics": {
    title: "ComfyUI Básico",
    description: "Aprende los fundamentos de ComfyUI desde cero. Domina la interfaz, los nodos básicos y crea tu primer workflow.",
    progress: 33,
    lessons: [
      { id: "1", title: "Introducción a ComfyUI", duration: "15 min", completed: true },
      { id: "2", title: "La Interfaz de Usuario", duration: "20 min", completed: true },
      { id: "3", title: "Tu Primer Workflow", duration: "25 min", completed: false },
      { id: "4", title: "Nodos de Imagen", duration: "30 min", completed: false },
      { id: "5", title: "Samplers y CFG", duration: "20 min", completed: false },
      { id: "6", title: "Proyecto Final", duration: "45 min", completed: false },
    ],
  },
  "advanced-nodes": {
    title: "Nodos Avanzados",
    description: "Explora nodos avanzados de ComfyUI: ControlNet, IP-Adapter, animación y más.",
    progress: 0,
    lessons: [
      { id: "1", title: "ControlNet Fundamentals", duration: "30 min", completed: false },
      { id: "2", title: "IP-Adapter Mastery", duration: "35 min", completed: false },
      { id: "3", title: "AnimateDiff", duration: "40 min", completed: false },
      { id: "4", title: "Custom Nodes", duration: "25 min", completed: false },
    ],
  },
};

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = COURSES[courseId];

  if (!course) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 text-foreground-subtle" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Curso no encontrado</h1>
          <p className="text-foreground-muted mb-4">El curso que buscas no existe.</p>
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-accent-purple hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Academia
          </Link>
        </div>
      </div>
    );
  }

  const completedLessons = course.lessons.filter(l => l.completed).length;
  const totalLessons = course.lessons.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Academia", href: "/academy" },
            { label: course.title },
          ]}
        />

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-accent-purple/20 rounded-xl">
              <GraduationCap className="h-8 w-8 text-accent-purple" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              <p className="text-foreground-muted mt-1">{course.description}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-slow"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-accent-purple">
              {completedLessons}/{totalLessons} lecciones
            </span>
          </div>
        </div>

        {/* Lessons list */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contenido del Curso</h2>
          
          {course.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/academy/${courseId}/lesson/${lesson.id}`}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-fast",
                "hover:border-border-accent hover:bg-surface-elevated",
                lesson.completed
                  ? "bg-surface-base border-border-subtle"
                  : "bg-surface-elevated border-border-subtle"
              )}
            >
              {/* Lesson number/status */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                lesson.completed
                  ? "bg-semantic-success/20 text-semantic-success"
                  : "bg-surface-overlay text-foreground-muted"
              )}>
                {lesson.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Lesson info */}
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium truncate",
                  lesson.completed ? "text-foreground-muted" : "text-foreground"
                )}>
                  {lesson.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5 text-foreground-subtle" />
                  <span className="text-xs text-foreground-subtle">{lesson.duration}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 shrink-0">
                {!lesson.completed && index === completedLessons && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-accent-purple/20 text-accent-purple">
                    Siguiente
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-foreground-subtle" />
              </div>
            </Link>
          ))}
        </div>

        {/* Back link */}
        <div className="pt-4 border-t border-border-subtle">
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Academia
          </Link>
        </div>
      </div>
    </div>
  );
}
