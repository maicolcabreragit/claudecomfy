/**
 * Podcast Download API
 * GET /api/podcast/[id]/download - Download podcast audio with ID3 metadata
 * 
 * Returns the MP3 file with proper headers for download and
 * embedded ID3v2 metadata for Spotify/Apple Podcasts compatibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";
import { addID3Metadata, buildPodcastMetadata } from "@/lib/podcast-metadata";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const prisma = getPrisma();

    // Get episode with full details
    const episode = await prisma.podcastEpisode.findUnique({
      where: { id },
      select: {
        id: true,
        episodeNumber: true,
        title: true,
        description: true,
        audioUrl: true,
        audioDuration: true,
        status: true,
        createdAt: true,
      },
    });

    if (!episode) {
      return NextResponse.json({
        success: false,
        error: "Episodio no encontrado",
      }, { status: 404 });
    }

    if (!episode.audioUrl) {
      return NextResponse.json({
        success: false,
        error: "Este episodio no tiene audio generado",
      }, { status: 400 });
    }

    if (episode.status !== "READY" && episode.status !== "PUBLISHED") {
      return NextResponse.json({
        success: false,
        error: "El audio aún no está listo",
      }, { status: 400 });
    }

    // Get podcast config for metadata
    const config = await prisma.podcastConfig.findFirst({
      select: { podcastName: true },
    });
    const podcastName = config?.podcastName || "IA Sin Filtros";

    // Read audio file
    const filepath = join(process.cwd(), "public", episode.audioUrl);
    
    let audioBuffer: Buffer;
    try {
      audioBuffer = await readFile(filepath);
    } catch {
      return NextResponse.json({
        success: false,
        error: "Archivo de audio no encontrado",
      }, { status: 404 });
    }

    // Add ID3 metadata
    const metadata = buildPodcastMetadata({
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      description: episode.description,
      audioDuration: episode.audioDuration,
      createdAt: episode.createdAt,
    }, podcastName);

    const audioWithMetadata = addID3Metadata(audioBuffer, metadata);

    // Generate download filename (Spotify-friendly: no special chars)
    const slug = episode.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    
    const paddedEpisode = String(episode.episodeNumber).padStart(3, "0");
    const downloadFilename = `EP${paddedEpisode}-${slug}.mp3`;

    console.log(`[Download] Serving ${downloadFilename} (${formatSize(audioWithMetadata.length)})`);

    // Return audio file with download headers
    return new NextResponse(audioWithMetadata, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": audioWithMetadata.length.toString(),
        "Cache-Control": "private, max-age=86400",
        // Additional headers for compatibility
        "X-Episode-Number": episode.episodeNumber.toString(),
        "X-Episode-Title": encodeURIComponent(episode.title),
      },
    });

  } catch (error) {
    console.error("[Download API] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to download audio",
    }, { status: 500 });
  }
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}
