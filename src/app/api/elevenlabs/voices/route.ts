/**
 * ElevenLabs Voices API
 * GET /api/elevenlabs/voices - List available Spanish voices
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getElevenLabsService, type VoiceWithMetadata } from "@/lib/elevenlabs";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

export async function GET() {
  try {
    const service = getElevenLabsService();
    
    // Get Spanish voices from ElevenLabs API
    const spanishVoices = await service.getSpanishVoices();
    
    // Get any custom metadata from our database
    const prisma = getPrisma();
    const customMetadata = await prisma.voiceMetadata.findMany({
      where: { language: "es" },
    });
    
    // Merge custom metadata with API data
    const voicesWithMetadata: VoiceWithMetadata[] = spanishVoices.map(voice => {
      const custom = customMetadata.find(m => m.id === voice.voice_id);
      if (custom) {
        return {
          ...voice,
          podcastScore: custom.podcastScore,
          isRecommended: custom.isRecommended,
          style: custom.style,
        };
      }
      return voice;
    });

    // Sort by recommendation and podcast score
    voicesWithMetadata.sort((a, b) => {
      // Recommended first
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      // Then by podcast score
      return (b.podcastScore || 0) - (a.podcastScore || 0);
    });

    return NextResponse.json({
      success: true,
      count: voicesWithMetadata.length,
      voices: voicesWithMetadata,
    });

  } catch (error) {
    console.error("[Voices API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Check for API key issues
    if (message.includes("API key") || message.includes("not configured")) {
      return NextResponse.json({
        success: false,
        error: "ElevenLabs API key not configured",
        setupUrl: "https://elevenlabs.io/app/settings/api-keys",
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
