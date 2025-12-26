/**
 * Podcast Audio Generation API
 * POST /api/podcast/[id]/generate - Generate audio for an episode
 * 
 * Takes the episode's script and generates audio using ElevenLabs,
 * then updates the episode with the audio URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  getElevenLabsService,
  formatFileSize,
  type VoiceSettings,
} from "@/lib/elevenlabs";
import { cleanScriptForTTS, estimateDuration } from "@/lib/podcast-script";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const prisma = getPrisma();

  try {
    // Get episode
    const episode = await prisma.podcastEpisode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json({
        success: false,
        error: "Episodio no encontrado",
      }, { status: 404 });
    }

    if (!episode.script) {
      return NextResponse.json({
        success: false,
        error: "El episodio no tiene script",
      }, { status: 400 });
    }

    // Check if already generating
    if (episode.status === "GENERATING") {
      return NextResponse.json({
        success: false,
        error: "El episodio ya está siendo generado",
      }, { status: 409 });
    }

    // Update status to GENERATING
    await prisma.podcastEpisode.update({
      where: { id },
      data: { status: "GENERATING" },
    });

    console.log(`[Generate Audio] Starting for episode ${id}`);

    try {
      const service = getElevenLabsService();
      
      // Clean script for TTS
      const cleanScript = cleanScriptForTTS(episode.script);
      
      // Estimate credits
      const estimatedCredits = service.estimateCredits(cleanScript);
      const estimatedDurationSecs = estimateDuration(cleanScript);
      
      console.log(`[Generate Audio] Script: ${cleanScript.length} chars, ~${estimatedCredits} credits, ~${Math.round(estimatedDurationSecs / 60)} min`);

      // Get voice settings
      const voiceSettings: VoiceSettings = (episode.voiceSettings as VoiceSettings) || {
        stability: 0.5,
        similarity_boost: 0.75,
      };

      // Generate audio
      const audioBuffer = await service.generateSpeech({
        voiceId: episode.voiceId,
        text: cleanScript,
        settings: voiceSettings,
      });

      console.log(`[Generate Audio] Generated ${formatFileSize(audioBuffer.length)} audio`);

      // Ensure podcasts directory exists
      const podcastsDir = join(process.cwd(), "public", "podcasts");
      await mkdir(podcastsDir, { recursive: true });

      // Generate filename
      const slug = episode.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50);
      const filename = `ep${episode.episodeNumber}-${slug}.mp3`;
      const filepath = join(podcastsDir, filename);

      // Save audio file
      await writeFile(filepath, audioBuffer);
      
      const audioUrl = `/podcasts/${filename}`;
      
      console.log(`[Generate Audio] Saved to ${audioUrl}`);

      // Update episode with audio info
      const updatedEpisode = await prisma.podcastEpisode.update({
        where: { id },
        data: {
          status: "READY",
          audioUrl,
          audioSize: audioBuffer.length,
          audioDuration: estimatedDurationSecs,
          creditsUsed: estimatedCredits,
        },
      });

      return NextResponse.json({
        success: true,
        episode: {
          id: updatedEpisode.id,
          title: updatedEpisode.title,
          status: updatedEpisode.status,
          audioUrl: updatedEpisode.audioUrl,
          audioDuration: updatedEpisode.audioDuration,
          audioSize: updatedEpisode.audioSize,
          creditsUsed: updatedEpisode.creditsUsed,
        },
        message: "Audio generado correctamente",
      });

    } catch (genError) {
      // Update status to FAILED
      await prisma.podcastEpisode.update({
        where: { id },
        data: { status: "FAILED" },
      });

      throw genError;
    }

  } catch (error) {
    console.error("[Generate Audio] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Check for specific errors
    if (message.includes("rate limit") || message.includes("429")) {
      return NextResponse.json({
        success: false,
        error: "Rate limit de ElevenLabs. Espera un momento e intenta de nuevo.",
        retryAfter: 60,
      }, { status: 429 });
    }
    
    if (message.includes("quota") || message.includes("credits")) {
      return NextResponse.json({
        success: false,
        error: "Créditos insuficientes en ElevenLabs.",
      }, { status: 402 });
    }
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
