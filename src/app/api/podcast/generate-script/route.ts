/**
 * Podcast Script Generation API
 * POST /api/podcast/generate-script - Generate podcast script from trends
 * 
 * Input: { trendIds: string[], episodeNumber?: number, customInstructions?: string }
 * Returns: { script, title, estimatedDuration, wordCount }
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  generatePodcastScript,
  validateScript,
  cleanScriptForTTS,
  type TrendForScript,
  type PodcastConfigForScript,
} from "@/lib/podcast-script";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

interface GenerateScriptRequest {
  trendIds: string[];
  episodeNumber?: number;
  customInstructions?: string;
  saveAsDraft?: boolean;
  voiceId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateScriptRequest = await req.json();
    
    if (!body.trendIds || body.trendIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Se requiere al menos un trend para generar el script",
      }, { status: 400 });
    }

    const prisma = getPrisma();

    // Get trends from database
    const trends = await prisma.trend.findMany({
      where: {
        id: { in: body.trendIds },
      },
      orderBy: { heatScore: "desc" },
    });

    if (trends.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No se encontraron los trends especificados",
      }, { status: 404 });
    }

    // Get or create podcast config
    let config = await prisma.podcastConfig.findFirst();
    if (!config) {
      // Create default config
      config = await prisma.podcastConfig.create({
        data: {
          podcastName: "IA Sin Filtros",
          podcastDescription: "Noticias de IA explicadas para que cualquiera las entienda",
          introScript: "Hola, bienvenidos de vuelta a IA Sin Filtros, el podcast donde te cuento las noticias de inteligencia artificial que REALMENTE importan, explicadas para que cualquiera las entienda.",
          outroScript: "Eso fue todo por hoy. Si te gustó, no olvides suscribirte y compartir con alguien que también quiera aprender sobre IA. Nos vemos en el próximo episodio.",
          characterPhrases: [
            "Y eso tiene implicaciones ENORMES para ti",
            "Esto es EXACTAMENTE lo que necesitas saber",
            "La pregunta del millón es...",
          ],
          targetDuration: 420, // 7 minutes
        },
      });
    }

    // Get next episode number
    const episodeNumber = body.episodeNumber || await getNextEpisodeNumber(prisma);

    // Convert to script format
    const trendsForScript: TrendForScript[] = trends.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      url: t.url || undefined,
      heatScore: t.heatScore,
    }));

    const configForScript: PodcastConfigForScript = {
      podcastName: config.podcastName,
      introScript: config.introScript || undefined,
      outroScript: config.outroScript || undefined,
      characterPhrases: config.characterPhrases,
      targetDuration: config.targetDuration,
    };

    console.log(`[GenerateScript] Generating EP${episodeNumber} with ${trends.length} trends`);

    // Generate script with Claude
    const generated = await generatePodcastScript({
      trends: trendsForScript,
      config: configForScript,
      episodeNumber,
      customInstructions: body.customInstructions,
    });

    // Validate script
    const validation = validateScript(generated.script);

    // Save as draft if requested
    let episodeId: string | null = null;
    if (body.saveAsDraft !== false) {
      const episode = await prisma.podcastEpisode.create({
        data: {
          episodeNumber,
          title: generated.title,
          description: `Análisis de: ${trends.map(t => t.title).join(", ")}`,
          script: generated.script,
          voiceId: body.voiceId || config.defaultVoiceId || "21m00Tcm4TlvDq8ikWAM",
          voiceSettings: config.defaultVoiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75,
          },
          status: "DRAFT",
          trendIds: body.trendIds,
        },
      });
      episodeId = episode.id;
      console.log(`[GenerateScript] Saved draft episode ${episodeId}`);
    }

    return NextResponse.json({
      success: true,
      episodeId,
      episodeNumber,
      title: generated.title,
      script: generated.script,
      scriptClean: cleanScriptForTTS(generated.script),
      sections: generated.sections,
      wordCount: generated.wordCount,
      estimatedDuration: generated.estimatedDuration,
      estimatedDurationMinutes: Math.round(generated.estimatedDuration / 60),
      validation,
      trendsUsed: trends.map(t => ({ id: t.id, title: t.title })),
    });

  } catch (error) {
    console.error("[GenerateScript] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Check for API key issues
    if (message.includes("API key") || message.includes("authentication")) {
      return NextResponse.json({
        success: false,
        error: "Error de autenticación con la API de Claude",
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}

async function getNextEpisodeNumber(prisma: PrismaClient): Promise<number> {
  const lastEpisode = await prisma.podcastEpisode.findFirst({
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });
  
  return (lastEpisode?.episodeNumber || 0) + 1;
}
