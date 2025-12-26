"use client";

import { MessageSquare, Archive, TrendingUp, Radio, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

interface StatsGridProps {
  conversations: number;
  snippets: number;
  trends: number;
  podcasts?: number;
  className?: string;
}

/**
 * StatsGrid - Grid of usage statistics
 */
export function StatsGrid({
  conversations,
  snippets,
  trends,
  podcasts = 0,
  className,
}: StatsGridProps) {
  const stats: StatItem[] = [
    {
      label: "Conversaciones",
      value: conversations,
      icon: MessageSquare,
      color: "text-blue-400",
    },
    {
      label: "Snippets",
      value: snippets,
      icon: Archive,
      color: "text-green-400",
    },
    {
      label: "Trends analizados",
      value: trends,
      icon: TrendingUp,
      color: "text-orange-400",
    },
    {
      label: "Podcasts",
      value: podcasts,
      icon: Radio,
      color: "text-pink-400",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: StatItem) {
  return (
    <div className="p-4 bg-surface-elevated rounded-xl border border-border-subtle">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs text-foreground-subtle">{label}</span>
      </div>
      <span className="text-xl font-bold text-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
