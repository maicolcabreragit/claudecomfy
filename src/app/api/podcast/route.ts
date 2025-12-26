/**
 * Podcast Episodes API
 * 
 * GET  /api/podcast - List all episodes
 * POST /api/podcast - Create new episode (manual)
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PodcastStatus } from "@prisma/client";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

// GET - List episodes with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as PodcastStatus | null;
    const search = searchParams.get("search");
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      status?: PodcastStatus;
      OR?: Array<{ title?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
    } = {};
    
    if (status && Object.values(PodcastStatus).includes(status)) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get episodes with pagination
    const [episodes, total] = await Promise.all([
      prisma.podcastEpisode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          description: true,
          audioUrl: true,
          audioDuration: true,
          status: true,
          publishedPlatforms: true,
          trendIds: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.podcastEpisode.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.podcastEpisode.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusCounts = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      episodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        drafts: statusCounts.DRAFT || 0,
        ready: statusCounts.READY || 0,
        published: statusCounts.PUBLISHED || 0,
      },
    });

  } catch (error) {
    console.error("[Podcast API] GET Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch episodes",
    }, { status: 500 });
  }
}

// POST - Create new episode manually
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prisma = getPrisma();
    
    if (!body.title || !body.script) {
      return NextResponse.json({
        success: false,
        error: "Se requiere título y script",
      }, { status: 400 });
    }

    // Get next episode number
    const lastEpisode = await prisma.podcastEpisode.findFirst({
      orderBy: { episodeNumber: "desc" },
      select: { episodeNumber: true },
    });
    
    const episodeNumber = body.episodeNumber || (lastEpisode?.episodeNumber || 0) + 1;

    // Get default voice from config
    const config = await prisma.podcastConfig.findFirst();
    const defaultVoiceId = config?.defaultVoiceId || "21m00Tcm4TlvDq8ikWAM";
    const defaultSettings = config?.defaultVoiceSettings || {
      stability: 0.5,
      similarity_boost: 0.75,
    };

    const episode = await prisma.podcastEpisode.create({
      data: {
        episodeNumber,
        title: body.title,
        description: body.description || null,
        script: body.script,
        voiceId: body.voiceId || defaultVoiceId,
        voiceSettings: body.voiceSettings || defaultSettings,
        status: "DRAFT",
        trendIds: body.trendIds || [],
      },
    });

    console.log(`[Podcast API] Created episode ${episode.id}`);

    return NextResponse.json({
      success: true,
      episode,
    });

  } catch (error) {
    console.error("[Podcast API] POST Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create episode",
    }, { status: 500 });
  }
}
