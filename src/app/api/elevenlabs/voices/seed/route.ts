/**
 * Voice Metadata Seed API
 * POST /api/elevenlabs/voices/seed - Seed recommended voice metadata
 * 
 * Seeds the VoiceMetadata table with our curated list of recommended
 * Spanish voices for podcasting.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

// Curated list of recommended Spanish voices
// These are based on ElevenLabs voice library research
const RECOMMENDED_VOICES = [
  // Spanish Spain
  {
    id: "Dante", // ElevenLabs voice name used as placeholder
    name: "Dante",
    language: "es",
    accent: "Spain",
    gender: "male",
    ageGroup: "middle-aged",
    style: ["narrative", "professional", "deep"],
    podcastScore: 9,
    isRecommended: true,
    notes: "Voz masculina dinámica, ideal para narración y podcasts serios",
  },
  {
    id: "Mikel",
    name: "Mikel",
    language: "es",
    accent: "Spain",
    gender: "male",
    ageGroup: "young-adult",
    style: ["conversational", "natural", "friendly"],
    podcastScore: 8,
    isRecommended: true,
    notes: "Conversacional y natural, perfecto para podcasts casuales",
  },
  // Spanish LATAM
  {
    id: "Yinet",
    name: "Yinet",
    language: "es",
    accent: "Colombian",
    gender: "female",
    ageGroup: "young-adult",
    style: ["energetic", "informative", "cheerful"],
    podcastScore: 9,
    isRecommended: true,
    notes: "Femenina colombiana, alegre e informativa, ideal para noticias",
  },
  {
    id: "Franco",
    name: "Franco",
    language: "es",
    accent: "Argentine",
    gender: "male",
    ageGroup: "adult",
    style: ["professional", "authoritative", "clear"],
    podcastScore: 8,
    isRecommended: true,
    notes: "Argentina autoritativa, ideal para contenido educativo",
  },
  {
    id: "Javier",
    name: "Javier",
    language: "es",
    accent: "Argentine",
    gender: "male",
    ageGroup: "middle-aged",
    style: ["narrative", "professional", "warm"],
    podcastScore: 8,
    isRecommended: true,
    notes: "Voz cálida argentina, buena para storytelling",
  },
  {
    id: "Lumina",
    name: "Lumina",
    language: "es",
    accent: "Latin American Neutral",
    gender: "female",
    ageGroup: "young-adult",
    style: ["versatile", "neutral", "modern"],
    podcastScore: 9,
    isRecommended: true,
    notes: "Neutra latinoamericana muy versátil, funciona para todo",
  },
];

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Get existing metadata
    const existing = await prisma.voiceMetadata.findMany({
      select: { id: true },
    });
    const existingIds = new Set(existing.map(e => e.id));

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const voice of RECOMMENDED_VOICES) {
      const data = {
        name: voice.name,
        language: voice.language,
        accent: voice.accent,
        gender: voice.gender,
        ageGroup: voice.ageGroup,
        style: voice.style,
        podcastScore: voice.podcastScore,
        isRecommended: voice.isRecommended,
        lastFetched: new Date(),
      };

      if (existingIds.has(voice.id)) {
        // Update existing
        await prisma.voiceMetadata.update({
          where: { id: voice.id },
          data,
        });
        results.updated++;
      } else {
        // Create new
        await prisma.voiceMetadata.create({
          data: {
            id: voice.id,
            ...data,
          },
        });
        results.created++;
      }
    }

    console.log(`[Seed Voices] Created: ${results.created}, Updated: ${results.updated}`);

    return NextResponse.json({
      success: true,
      message: "Voice metadata seeded successfully",
      results,
    });

  } catch (error) {
    console.error("[Seed Voices] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to seed voice metadata",
    }, { status: 500 });
  }
}

// GET - List all custom voice metadata
export async function GET() {
  try {
    const prisma = getPrisma();
    
    const metadata = await prisma.voiceMetadata.findMany({
      orderBy: [
        { isRecommended: "desc" },
        { podcastScore: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      count: metadata.length,
      metadata,
    });

  } catch (error) {
    console.error("[Seed Voices] Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch voice metadata",
    }, { status: 500 });
  }
}
