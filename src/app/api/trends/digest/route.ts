/**
 * Weekly Digest API
 * POST /api/trends/digest - Generate weekly digest with Claude
 * GET /api/trends/digest - Get latest digest
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// Use Gemini for digest generation (cheaper than Claude for summaries)
function getGemini() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// GET - Get latest digest from trends
export async function GET() {
  try {
    const prisma = getPrisma();
    
    // Get trends from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const trends = await prisma.trend.findMany({
      where: {
        fetchedAt: { gte: weekAgo },
      },
      orderBy: { heatScore: "desc" },
      take: 50,
    });

    // Group by category
    const grouped: Record<string, typeof trends> = {};
    for (const trend of trends) {
      if (!grouped[trend.category]) {
        grouped[trend.category] = [];
      }
      grouped[trend.category].push(trend);
    }

    return NextResponse.json({
      period: {
        from: weekAgo.toISOString(),
        to: new Date().toISOString(),
      },
      totalTrends: trends.length,
      byCategory: grouped,
      topTrends: trends.slice(0, 10),
    });
  } catch (error) {
    console.error("[Digest] Error:", error);
    return NextResponse.json({ error: "Failed to get digest" }, { status: 500 });
  }
}

// POST - Generate AI digest summary
export async function POST() {
  try {
    const prisma = getPrisma();
    const gemini = getGemini();
    
    // Get trends from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const trends = await prisma.trend.findMany({
      where: {
        fetchedAt: { gte: weekAgo },
      },
      orderBy: { heatScore: "desc" },
      take: 30,
    });

    if (trends.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No hay tendencias para resumir. Usa /api/trends POST primero.",
      });
    }

    // Prepare trends for AI
    const trendsSummary = trends.map(t => 
      `[${t.category}] ${t.title} (Score: ${t.heatScore})`
    ).join("\n");

    let digest = "";
    
    if (gemini) {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Eres un analista de tendencias en AI Models y monetización digital.

Analiza estas tendencias de la última semana y genera un resumen ejecutivo en español:

${trendsSummary}

Formato del resumen:
## 🔥 Lo Más Importante
(3 puntos clave que debes saber)

## 💰 Oportunidades de Monetización
(Basado en las tendencias, qué oportunidades hay)

## 🛠️ Técnicas Trending
(Nuevas técnicas o herramientas mencionadas)

## 📈 Predicción
(Hacia dónde va el mercado esta semana)

Sé conciso, máximo 300 palabras total.`;

      const result = await model.generateContent(prompt);
      digest = result.response.text();
      
      console.log("[Digest] Generated with Gemini");
    } else {
      // Fallback: simple summary without AI
      digest = `## Resumen Semanal (${trends.length} tendencias)

### Top 5 Tendencias
${trends.slice(0, 5).map((t, i) => `${i + 1}. **${t.title}** (${t.category})`).join("\n")}

*Configura GOOGLE_GEMINI_API_KEY para resúmenes con AI*`;
    }

    return NextResponse.json({
      success: true,
      digest,
      trendsAnalyzed: trends.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Digest] Error:", error);
    return NextResponse.json({ error: "Failed to generate digest" }, { status: 500 });
  }
}
