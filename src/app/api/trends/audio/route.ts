/**
 * Trends Audio API - ElevenLabs TTS for trend narration
 * POST /api/trends/audio - Generate audio summary of trends
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

function getGemini() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// POST - Generate audio narration of trends
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const voiceId = body.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel (female)
    
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return NextResponse.json({
        success: false,
        error: "ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to .env.local",
        setupUrl: "https://elevenlabs.io/app/settings/api-keys",
      });
    }

    const prisma = getPrisma();
    const gemini = getGemini();

    // Get recent trends
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const trends = await prisma.trend.findMany({
      where: { fetchedAt: { gte: weekAgo } },
      orderBy: { heatScore: "desc" },
      take: 15, // Top 15 for comprehensive podcast
    });

    if (trends.length === 0) {
      return NextResponse.json({ success: false, error: "No trends to narrate" });
    }

    // Generate detailed script with Gemini (5 minutes = ~750 words)
    let script = "";
    if (gemini) {
      const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-001" });
      
      const trendList = trends.map((t, i) => 
        `${i + 1}. "${t.title}" [Categoría: ${t.category}]\n   Detalle: ${t.description || "Sin descripción"}`
      ).join("\n\n");

      const prompt = `Eres un comentarista de noticias tecnológicas especializado en AI Models, Flux, SDXL y monetización digital. 
Tu audiencia son PRINCIPIANTES que quieren aprender a ganar dinero con modelos de IA.

Genera un script de podcast de 5 MINUTOS (aproximadamente 750-900 palabras) sobre estas tendencias de la semana.

TENDENCIAS DE ESTA SEMANA:
${trendList}

ESTRUCTURA DEL PODCAST:

1. INTRODUCCIÓN (30 segundos)
   - Bienvenida cálida
   - Qué van a aprender hoy
   - Por qué estas tendencias son importantes para ganar dinero

2. TENDENCIAS PRINCIPALES (3 minutos)
   - Explica cada tendencia como si hablaras con alguien que nunca ha usado IA
   - ¿Qué es? ¿Por qué importa? ¿Cómo me ayuda a ganar dinero?
   - Usa ejemplos concretos y números cuando sea posible
   - Conecta cada tendencia con oportunidades de monetización

3. CONSEJOS PRÁCTICOS (1 minuto)
   - 3 cosas que pueden hacer HOY con esta información
   - Herramientas específicas que deben probar
   - Errores comunes que deben evitar

4. CIERRE MOTIVADOR (30 segundos)
   - Resumen de lo más importante
   - Call to action: qué hacer ahora mismo
   - Despedida energética

REGLAS DE ESTILO:
- Tono: Como un amigo experto que te explica las cosas fácil
- Evita jerga técnica sin explicarla
- Usa frases como "esto significa que..." o "en otras palabras..."
- Incluye pausas naturales con "..." para que suene conversacional
- Sé específico: menciona nombres de herramientas, plataformas, precios
- Enfócate en cómo cada tendencia se traduce en DINERO

Responde ÚNICAMENTE con el script de audio, sin encabezados, sin marcas, sin asteriscos.
El script debe poder leerse directamente como audio natural.`;

      const result = await model.generateContent(prompt);
      script = result.response.text();
    } else {
      // Fallback script for non-Gemini case
      script = `Bienvenidos a Trend Radar, tu resumen semanal de tendencias en AI Models.

Esta semana tenemos ${trends.length} tendencias importantes que debes conocer si quieres ganar dinero con inteligencia artificial.

${trends.slice(0, 5).map((t, i) => `La tendencia número ${i + 1} es: ${t.title}. Esto es importante porque te ayuda a mejorar tus resultados.`).join(" ")}

Mi consejo para esta semana: dedica al menos una hora a probar estas nuevas técnicas. El mundo de la IA avanza rápido, y quienes se mantienen actualizados son los que más ganan.

Nos vemos la próxima semana con más tendencias. ¡A practicar!`;
    }

    // Generate audio with ElevenLabs
    const audioResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!audioResponse.ok) {
      const error = await audioResponse.text();
      console.error("[Audio] ElevenLabs error:", error);
      return NextResponse.json({ 
        success: false, 
        error: "ElevenLabs API error",
        script, // Still return script
      });
    }

    // Return audio as base64
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    console.log(`[Audio] Generated ${Math.round(audioBuffer.byteLength / 1024)}KB audio`);

    return NextResponse.json({
      success: true,
      script,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      trendsCount: trends.length,
    });

  } catch (error) {
    console.error("[Audio] Error:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}

// GET - Available voices
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", accent: "American" },
      { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", accent: "American" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", accent: "American" },
      { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male", accent: "American" },
    ],
    tip: "Use POST with voiceId to generate audio",
  });
}
