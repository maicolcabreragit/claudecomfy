/**
 * Podcast Config API
 * 
 * GET  /api/podcast/config - Get podcast configuration
 * POST /api/podcast/config - Create or update configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

// GET - Get current podcast config
export async function GET() {
  try {
    const prisma = getPrisma();
    
    let config = await prisma.podcastConfig.findFirst();
    
    // Return default config if none exists
    if (!config) {
      return NextResponse.json({
        success: true,
        config: {
          podcastName: "IA Sin Filtros",
          podcastDescription: "Noticias de IA explicadas para que cualquiera las entienda",
          introScript: null,
          outroScript: null,
          defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
          defaultVoiceSettings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          characterPhrases: [],
          targetDuration: 420,
          publishFrequency: "weekly",
        },
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      config,
      isDefault: false,
    });

  } catch (error) {
    console.error("[Config API] GET Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch config",
    }, { status: 500 });
  }
}

// POST - Create or update config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prisma = getPrisma();

    // Check for existing config
    const existing = await prisma.podcastConfig.findFirst();

    const configData = {
      podcastName: body.podcastName || "IA Sin Filtros",
      podcastDescription: body.podcastDescription || null,
      introScript: body.introScript || null,
      outroScript: body.outroScript || null,
      defaultVoiceId: body.defaultVoiceId || null,
      defaultVoiceSettings: body.defaultVoiceSettings || null,
      characterPhrases: body.characterPhrases || [],
      targetDuration: body.targetDuration || 420,
      publishFrequency: body.publishFrequency || "weekly",
      spotifyShowId: body.spotifyShowId || null,
      ivooxShowId: body.ivooxShowId || null,
    };

    let config;
    if (existing) {
      config = await prisma.podcastConfig.update({
        where: { id: existing.id },
        data: configData,
      });
      console.log("[Config API] Updated podcast config");
    } else {
      config = await prisma.podcastConfig.create({
        data: configData,
      });
      console.log("[Config API] Created podcast config");
    }

    return NextResponse.json({
      success: true,
      config,
      created: !existing,
    });

  } catch (error) {
    console.error("[Config API] POST Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to save config",
    }, { status: 500 });
  }
}
