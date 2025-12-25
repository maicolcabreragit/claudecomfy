/**
 * Trends to Chat API - Send analyzed trends to Claude chat
 * POST /api/trends/to-chat - Creates a new conversation with trend context
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

const DEFAULT_USER_ID = "default-user-id";

// POST - Create conversation with trend course context
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const learningContent = body.learningContent;
    
    const prisma = getPrisma();
    const gemini = getGemini();

    // Get recent trends if no learning content provided
    let courseContext = "";
    
    if (learningContent) {
      // Use provided learning content
      courseContext = JSON.stringify(learningContent, null, 2);
    } else {
      // Generate fresh from trends
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const trends = await prisma.trend.findMany({
        where: { fetchedAt: { gte: weekAgo } },
        orderBy: { heatScore: "desc" },
        take: 20,
      });

      if (trends.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No hay tendencias. Busca primero en /trends",
        });
      }

      // Generate course with Gemini
      if (gemini) {
        const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-001" });
        
        const trendList = trends.map(t => 
          `- ${t.title} (${t.category}): ${t.description?.slice(0, 150)}`
        ).join("\n");

        const prompt = `Crea un CURSO ESTRUCTURADO basado en estas tendencias de AI Models.
El objetivo es: Ganar 5000€/mes con modelos de IA realistas.

Tendencias:
${trendList}

Formato del curso:
## Módulo 1: [Título]
### Lección 1.1: [Tema]
- Concepto clave
- Paso práctico
- Recurso recomendado

[Continuar con más módulos...]

## Ejercicios Prácticos
1. [Ejercicio basado en las tendencias]

Sé específico y práctico. Máximo 1500 palabras.`;

        const result = await model.generateContent(prompt);
        courseContext = result.response.text();
      } else {
        courseContext = trends.map(t => `• ${t.title}`).join("\n");
      }
    }

    // Create new conversation with course as context
    const conversation = await prisma.conversation.create({
      data: {
        title: `🎓 Curso AI Models - ${new Date().toLocaleDateString("es-ES")}`,
        userId: DEFAULT_USER_ID,
      },
    });

    // Add the course as first message (from assistant)
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: `# 🎓 Curso de AI Models - Basado en Tendencias Actuales

${courseContext}

---

**¿Listo para empezar?** Pregúntame cualquier cosa sobre estos temas. Puedo:
- Explicar conceptos en detalle
- Darte ejercicios prácticos
- Resolver dudas específicas
- Guiarte paso a paso

¿Qué te gustaría aprender primero?`,
      },
    });

    console.log(`[ToChat] Created course conversation: ${conversation.id}`);

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: "Curso creado. Redirigiendo al chat...",
    });

  } catch (error) {
    console.error("[ToChat] Error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
