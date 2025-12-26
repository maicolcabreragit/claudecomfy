"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  BookOpen,
  Sparkles,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ModuleList } from "./components/ModuleList";
import { CreateModuleModal } from "./components/CreateModuleModal";

// ============================================================================
// Types
// ============================================================================

interface Stats {
  conversations: number;
  snippets: number;
  trends: number;
}

interface LearningUnit {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface LearningModule {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  progress: number;
  conversationId: string | null;
  isManual: boolean;
  units: LearningUnit[];
  createdAt: string;
  updatedAt: string;
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
// Static Data (Achievements - will be dynamic later)
// ============================================================================

const ACHIEVEMENTS: Achievement[] = [
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
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  
  // Data states
  const [stats, setStats] = useState<Stats>({ conversations: 0, snippets: 0, trends: 0 });
  const [modules, setModules] = useState<LearningModule[]>([]);
  
  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Computed stats
  const activeModules = modules.filter((m) => m.status === "ACTIVE").length;
  const completedModules = modules.filter((m) => m.status === "COMPLETED").length;
  const streak = 3; // TODO: Calculate from module activity dates
  const todayMinutes = 47; // TODO: Track session time
  const achievements = ACHIEVEMENTS;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Fetch modules
  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/learning/modules");
      const data = await res.json();
      if (data.modules) {
        setModules(data.modules);
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    } finally {
      setIsLoadingModules(false);
    }
  }, []);

  // Fetch stats
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
        setIsLoadingStats(false);
      }
    }

    fetchStats();
    fetchModules();
  }, [fetchModules]);

  // Handle module deletion (optimistic update)
  function handleDeleteModule(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

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

          {/* Active Modules */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  {isLoadingModules ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  ) : (
                    <p className="text-2xl font-bold">{activeModules}</p>
                  )}
                  <p className="text-xs text-zinc-500">Cursos activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Modules */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Trophy className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  {isLoadingModules ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  ) : (
                    <p className="text-2xl font-bold">{completedModules}</p>
                  )}
                  <p className="text-xs text-zinc-500">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo Curso
          </Button>
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
              Mis Cursos
            </h2>
            <span className="text-xs text-zinc-500">
              {activeModules} activos · {completedModules} completados
            </span>
          </div>

          <ModuleList
            modules={modules}
            isLoading={isLoadingModules}
            onModuleUpdate={fetchModules}
            onDelete={handleDeleteModule}
          />
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
          💡 Tip: Pregunta &quot;cómo hacer...&quot; en el chat para crear cursos automáticamente
        </p>
      </div>

      {/* Create Module Modal */}
      <CreateModuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchModules}
      />
    </div>
  );
}
