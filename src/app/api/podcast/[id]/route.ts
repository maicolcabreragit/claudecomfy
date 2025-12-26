/**
 * Podcast Episode Detail API
 * 
 * GET    /api/podcast/[id] - Get episode details
 * PATCH  /api/podcast/[id] - Update episode
 * DELETE /api/podcast/[id] - Delete episode
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, PodcastStatus } from "@prisma/client";
import { unlink } from "fs/promises";
import { join } from "path";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get episode details
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const prisma = getPrisma();

    const episode = await prisma.podcastEpisode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json({
        success: false,
        error: "Episodio no encontrado",
      }, { status: 404 });
    }

    // Get related trends if available
    let trends: Array<{ id: string; title: string; category: string }> = [];
    if (episode.trendIds.length > 0) {
      trends = await prisma.trend.findMany({
        where: { id: { in: episode.trendIds } },
        select: { id: true, title: true, category: true },
      });
    }

    return NextResponse.json({
      success: true,
      episode,
      trends,
    });

  } catch (error) {
    console.error("[Podcast API] GET Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch episode",
    }, { status: 500 });
  }
}

// PATCH - Update episode
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const prisma = getPrisma();

    // Check episode exists
    const existing = await prisma.podcastEpisode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "Episodio no encontrado",
      }, { status: 404 });
    }

    // Build update data
    const updateData: {
      title?: string;
      description?: string;
      script?: string;
      voiceId?: string;
      voiceSettings?: object;
      status?: PodcastStatus;
      audioUrl?: string;
      audioDuration?: number;
      audioSize?: number;
      publishedPlatforms?: string[];
      publishedAt?: Date;
      creditsUsed?: number;
    } = {};

    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.script) updateData.script = body.script;
    if (body.voiceId) updateData.voiceId = body.voiceId;
    if (body.voiceSettings) updateData.voiceSettings = body.voiceSettings;
    if (body.status && Object.values(PodcastStatus).includes(body.status)) {
      updateData.status = body.status;
      // Set publishedAt when marking as published
      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (body.audioUrl) updateData.audioUrl = body.audioUrl;
    if (body.audioDuration) updateData.audioDuration = body.audioDuration;
    if (body.audioSize) updateData.audioSize = body.audioSize;
    if (body.publishedPlatforms) updateData.publishedPlatforms = body.publishedPlatforms;
    if (body.creditsUsed) updateData.creditsUsed = body.creditsUsed;

    const episode = await prisma.podcastEpisode.update({
      where: { id },
      data: updateData,
    });

    console.log(`[Podcast API] Updated episode ${id}`);

    return NextResponse.json({
      success: true,
      episode,
    });

  } catch (error) {
    console.error("[Podcast API] PATCH Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update episode",
    }, { status: 500 });
  }
}

// DELETE - Delete episode
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const prisma = getPrisma();

    const episode = await prisma.podcastEpisode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json({
        success: false,
        error: "Episodio no encontrado",
      }, { status: 404 });
    }

    // Delete audio file if exists
    if (episode.audioUrl) {
      try {
        const filepath = join(process.cwd(), "public", episode.audioUrl);
        await unlink(filepath);
        console.log(`[Podcast API] Deleted audio file: ${episode.audioUrl}`);
      } catch {
        // File might not exist, that's ok
        console.log(`[Podcast API] Audio file not found: ${episode.audioUrl}`);
      }
    }

    await prisma.podcastEpisode.delete({
      where: { id },
    });

    console.log(`[Podcast API] Deleted episode ${id}`);

    return NextResponse.json({
      success: true,
      message: "Episodio eliminado",
    });

  } catch (error) {
    console.error("[Podcast API] DELETE Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete episode",
    }, { status: 500 });
  }
}
