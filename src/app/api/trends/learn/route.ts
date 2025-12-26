/**
 * Deep Learning API - Analiza tendencias en detalle para aprendizaje
 * POST /api/trends/learn - Genera contenido de aprendizaje profundo
 * GET /api/trends/learn - Lista análisis anteriores (digests)
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

function getGemini() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

interface LearningContent {
  category: string;
  trends: Array<{
    title: string;
    url: string;
    summary: string;
    keyTakeaways: string[];
    practicalSteps: string[];
    monetizationAngle: string;
    questionsToExplore: string[];
  }>;
}

// GET - List previous digests
export async function GET() {
  try {
    const prisma = getPrisma();
    
    const digests = await prisma.trendDigest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        audioUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      digests,
    });
  } catch (error) {
    console.error("[Learn] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch digests" }, { status: 500 });
  }
}

// POST - Generate deep learning content from trends
export async function POST() {
  try {
    const prisma = getPrisma();
    const gemini = getGemini();
    
    if (!gemini) {
      return NextResponse.json({
        success: false,
        error: "Gemini API no configurada",
      });
    }

    // Get trends from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const trends = await prisma.trend.findMany({
      where: { fetchedAt: { gte: weekAgo } },
      orderBy: { heatScore: "desc" },
      take: 30,
    });

    if (trends.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No hay tendencias. Usa /api/trends POST primero.",
      });
    }

    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Group trends by category
    const grouped: Record<string, typeof trends> = {};
    for (const trend of trends) {
      if (!grouped[trend.category]) grouped[trend.category] = [];
      grouped[trend.category].push(trend);
    }

    const learningContent: LearningContent[] = [];

    for (const [category, categoryTrends] of Object.entries(grouped)) {
      const trendList = categoryTrends.map(t => 
        `- "${t.title}" (${t.source}): ${t.description}`
      ).join("\n");

      const prompt = `Eres un experto en AI Models realistas y monetización digital. Tu objetivo es ayudarme a convertirme en experto y ganar 5000€/mes.

CATEGORÍA: ${category}
TENDENCIAS ENCONTRADAS:
${trendList}

Para CADA tendencia, analiza EN PROFUNDIDAD y devuelve un JSON con esta estructura:
{
  "trends": [
    {
      "title": "título original",
      "summary": "resumen detallado de 3-4 oraciones explicando qué es y por qué importa",
      "keyTakeaways": ["3-5 puntos clave que debo recordar"],
      "practicalSteps": ["3-5 pasos concretos que puedo hacer HOY para aplicar esto"],
      "monetizationAngle": "cómo esto me acerca a los 5000€/mes - sé específico",
      "questionsToExplore": ["2-3 preguntas que debería investigar más profundamente"]
    }
  ]
}

IMPORTANTE:
- Sé MUY específico y práctico
- Cada paso debe ser accionable
- Enfócate en cómo me ayuda a ganar dinero
- Las preguntas deben provocar curiosidad y aprendizaje más profundo
- Responde SOLO con el JSON, sin texto adicional`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Add URLs back from original trends
          const trendsWithUrls = (parsed.trends || []).map((t: { title: string }, i: number) => ({
            ...t,
            url: categoryTrends[i]?.url || "",
          }));

          learningContent.push({
            category,
            trends: trendsWithUrls,
          });
        }
      } catch (parseError) {
        console.error(`[Learn] Error parsing ${category}:`, parseError);
      }
    }

    // Generate summary
    const fullContent = JSON.stringify(learningContent, null, 2);
    const summaryPrompt = `Resume en 5 bullets el contenido más importante para alguien que quiere ganar 5000€/mes con AI Models:
${fullContent.slice(0, 3000)}`;
    
    let summary = "";
    try {
      const summaryResult = await model.generateContent(summaryPrompt);
      summary = summaryResult.response.text();
    } catch {
      summary = `Análisis de ${trends.length} tendencias en ${Object.keys(grouped).length} categorías`;
    }

    // Save to database as TrendDigest
    const today = new Date().toLocaleDateString("es-ES", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
    
    const digest = await prisma.trendDigest.create({
      data: {
        title: `Análisis del ${today}`,
        summary,
        content: learningContent,
        trendIds: trends.map(t => t.id),
      },
    });

    console.log(`[Learn] Saved digest ${digest.id} with ${trends.length} trends`);

    return NextResponse.json({
      success: true,
      digestId: digest.id,
      generatedAt: new Date().toISOString(),
      trendsAnalyzed: trends.length,
      categories: Object.keys(grouped).length,
      summary,
      content: learningContent,
    });

  } catch (error) {
    console.error("[Learn] Error:", error);
    return NextResponse.json({ error: "Failed to generate learning content" }, { status: 500 });
  }
}
