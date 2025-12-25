"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TrendCard } from "./TrendCard";
import { type Trend } from "./types";

interface TrendListProps {
  trends: Trend[];
  loading: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  onFetchNew: () => void;
}

/**
 * TrendList - List of trends with loading and empty states
 */
export function TrendList({
  trends,
  loading,
  expandedId,
  onToggleExpand,
  onFetchNew,
}: TrendListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-zinc-500">Cargando tendencias...</p>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 mb-4">No hay tendencias</p>
        <Button variant="primary" onClick={onFetchNew}>
          🔍 Buscar ahora
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trends.map((trend) => (
        <TrendCard
          key={trend.id}
          trend={trend}
          isExpanded={expandedId === trend.id}
          onToggle={() =>
            onToggleExpand(expandedId === trend.id ? null : trend.id)
          }
        />
      ))}
    </div>
  );
}
