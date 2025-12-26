import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TrendDetail } from "./TrendDetail";
import { Skeleton } from "@/components/ui";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Trend Detail Page - Server Component
 * 
 * Fetches trend data and renders detail view with analysis
 */
export default async function TrendDetailPage({ params }: Props) {
  const { id } = await params;

  // Fetch trend from database
  const trend = await prisma.trend.findUnique({
    where: { id },
  });

  if (!trend) {
    notFound();
  }

  // Transform for client
  const trendData = {
    id: trend.id,
    title: trend.title,
    description: trend.description,
    url: trend.url,
    source: trend.source,
    category: trend.category,
    heatScore: trend.heatScore,
    keywords: trend.keywords,
    publishedAt: trend.publishedAt?.toISOString() || null,
    fetchedAt: trend.fetchedAt.toISOString(),
  };

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<TrendDetailSkeleton />}>
        <TrendDetail trend={trendData} />
      </Suspense>
    </div>
  );
}

function TrendDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const trend = await prisma.trend.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!trend) {
    return { title: "Trend Not Found" };
  }

  return {
    title: `${trend.title} | Trend Radar`,
    description: trend.description?.slice(0, 160),
  };
}
