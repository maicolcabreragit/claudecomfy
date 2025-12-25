"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Flame,
  Clock,
  MessageSquare,
  Archive,
  TrendingUp,
  Trophy,
  Zap,
  Target,
  Star,
  ChevronRight,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// ============================================================================
// Types
// ============================================================================

interface Stats {
  conversations: number;
  snippets: number;
  trends: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  unlockedAt?: string;
}

// ============================================================================
// Mock Data (TODO: Replace with real API calls)
// ============================================================================

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Fundamentos de Flux.1",
    description: "Domina los conceptos básicos de generación fotorrealista",
    progress: 75,
    totalLessons: 12,
    completedLessons: 9,
  },
  {
    id: "2", 
    title: "Monetización con AI Art",
    description: "Estrategias para convertir tu arte en ingresos",
    progress: 30,
    totalLessons: 8,
    completedLessons: 2,
  },
  {
    id: "3",
    title: "Anti-Detección Avanzada",
    description: "Técnicas para eliminar el 'AI look' de tus imágenes",
    progress: 0,
    totalLessons: 6,
    completedLessons: 0,
  },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-chat",
    title: "Primera Conversación",
    description: "Iniciaste tu primera conversación con Claude",
    icon: MessageSquare,
    unlocked: true,
    unlockedAt: "2024-12-20",
  },
  {
    id: "snippet-master",
    title: "Maestro de Snippets",
    description: "Creaste 5 snippets en La Bóveda",
    icon: Archive,
    unlocked: true,
    unlockedAt: "2024-12-22",
  },
  {
    id: "trend-watcher",
    title: "Vigía de Tendencias",
    description: "Analizaste 10 tendencias en Trend Radar",
    icon: TrendingUp,
    unlocked: false,
  },
  {
    id: "streak-week",
    title: "Racha Semanal",
    description: "7 días consecutivos de uso",
    icon: Flame,
    unlocked: false,
  },
  {
    id: "monetizer",
    title: "Primer Ingreso",
    description: "Registraste tu primera venta con AI Art",
    icon: Zap,
    unlocked: false,
  },
  {
    id: "expert",
    title: "Experto Certificado",
    description: "Completaste todos los cursos",
    icon: Trophy,
    unlocked: false,
  },
];

// ============================================================================
// Component
// ============================================================================

export default function AcademyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ conversations: 0, snippets: 0, trends: 0 });
  
  // Mock data (TODO: fetch from APIs when available)
  const [streak] = useState(3); // TODO: Calculate from conversation dates
  const [todayMinutes] = useState(47); // TODO: Track session time
  const courses = MOCK_COURSES;
  const achievements = MOCK_ACHIEVEMENTS;

  // Fetch real stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const [convRes, snippetsRes, trendsRes] = await Promise.all([
          fetch("/api/conversations"),
          fetch("/api/snippets"),
          fetch("/api/trends"),
        ]);
        
        const [convData, snippetsData, trendsData] = await Promise.all([
          convRes.json(),
          snippetsRes.json(),
          trendsRes.json(),
        ]);

        setStats({
          conversations: convData.conversations?.length || 0,
          snippets: snippetsData.snippets?.length || 0,
          trends: trendsData.trends?.length || 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <GraduationCap className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Academia</h1>
              <p className="text-sm text-zinc-500">
                Tu progreso hacia los 5000€/mes
              </p>
            </div>
          </div>
          <Badge variant="primary" size="md">
            <Star className="h-3 w-3 mr-1" />
            Nivel: Aprendiz
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Streak */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak}</p>
                  <p className="text-xs text-zinc-500">Días de racha</p>
                </div>
              </div>
              {streak >= 7 && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Time */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayMinutes}m</p>
                  <p className="text-xs text-zinc-500">Tiempo hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversations */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.conversations}</p>
                  )}
                  <p className="text-xs text-zinc-500">Conversaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {unlockedCount}/{achievements.length}
                  </p>
                  <p className="text-xs text-zinc-500">Logros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            leftIcon={MessageSquare}
            onClick={() => router.push("/")}
          >
            Ir al Chat
          </Button>
          <Button
            variant="default"
            leftIcon={TrendingUp}
            onClick={() => router.push("/trends")}
          >
            Ver Tendencias
          </Button>
          <Button
            variant="default"
            leftIcon={Archive}
            onClick={() => router.push("/vault")}
          >
            Abrir Bóveda
          </Button>
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              Cursos Activos
            </h2>
            <span className="text-xs text-zinc-500">
              {courses.filter((c) => c.progress > 0).length} en progreso
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} interactive>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{course.title}</h3>
                  <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          course.progress === 100
                            ? "bg-semantic-success"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        )}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {course.completedLessons}/{course.totalLessons} lecciones
                    </span>
                    <Button variant="ghost" size="sm" rightIcon={ChevronRight}>
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Logros
            </h2>
            <span className="text-xs text-zinc-500">
              {unlockedCount} desbloqueados
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    "text-center transition-all",
                    !achievement.unlocked && "opacity-50 grayscale"
                  )}
                >
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        "w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center",
                        achievement.unlocked
                          ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                          : "bg-surface-elevated"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          achievement.unlocked
                            ? "text-yellow-400"
                            : "text-zinc-600"
                        )}
                      />
                    </div>
                    <h4 className="text-xs font-medium mb-0.5 line-clamp-1">
                      {achievement.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 line-clamp-2">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <Badge variant="success" size="sm" className="mt-2">
                        ✓ Desbloqueado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Goal Card */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Meta: 5000€/mes con AI Art
                </h3>
                <p className="text-sm text-zinc-400">
                  Completa los cursos, aplica las tendencias, y construye tu portfolio
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gradient">0€</p>
                <p className="text-xs text-zinc-500">Ingresos este mes</p>
              </div>
            </div>

            {/* Progress to goal */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Progreso hacia la meta</span>
                <span>0%</span>
              </div>
              <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-600">
          💡 Tip: Mantén tu racha activa para desbloquear logros especiales
        </p>
      </div>
    </div>
  );
}
