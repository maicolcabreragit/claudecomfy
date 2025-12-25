/**
 * Step Verification API with Gemini Flash
 * POST /api/extension/verify-step
 * 
 * Uses Gemini Flash for cheap, fast verification of learning steps
 * Much cheaper than Claude Opus for simple yes/no verification
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!genAI && geminiApiKey) {
    genAI = new GoogleGenerativeAI(geminiApiKey);
  }
  return genAI;
}

interface VerifyStepRequest {
  ocrText: string;           // Text from Vision OCR
  expectedStep: string;      // What the user should have done
  expectedElements?: string[]; // UI elements that should be visible
  imageUrl?: string;         // Optional: include image for visual verification
}

interface VerifyStepResponse {
  success: boolean;
  completed: boolean;
  confidence: number; // 0-100
  reason: string;
  nextHint?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<VerifyStepResponse | { error: string }>> {
  try {
    const body: VerifyStepRequest = await req.json();
    const { ocrText, expectedStep, expectedElements, imageUrl } = body;

    if (!ocrText && !imageUrl) {
      return NextResponse.json({ error: "Either ocrText or imageUrl is required" }, { status: 400 });
    }

    const client = getGeminiClient();
    
    if (!client) {
      console.log("[VerifyStep] No Gemini API key configured");
      // Fallback: simple text matching
      const textLower = ocrText.toLowerCase();
      const stepLower = expectedStep.toLowerCase();
      const keywords = stepLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = keywords.filter(kw => textLower.includes(kw)).length;
      const confidence = Math.round((matchCount / keywords.length) * 100);
      
      return NextResponse.json({
        success: true,
        completed: confidence >= 60,
        confidence,
        reason: "Verificación básica por keywords (sin Gemini)",
      });
    }

    // Use Gemini Flash for fast, cheap verification
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build prompt for verification
    const prompt = `Eres un verificador de pasos de tutorial. El usuario debería haber completado este paso:

PASO ESPERADO: "${expectedStep}"
${expectedElements ? `\nELEMENTOS ESPERADOS: ${expectedElements.join(", ")}` : ""}

TEXTO VISIBLE EN PANTALLA:
"""
${ocrText.slice(0, 1500)}
"""

Responde SOLO en este formato JSON:
{
  "completed": true/false,
  "confidence": 0-100,
  "reason": "explicación breve de 1 línea",
  "nextHint": "si no completado, qué hacer" 
}`;

    const parts: (string | { inlineData: { data: string; mimeType: string } })[] = [prompt];
    
    // If image provided, add it for visual verification
    if (imageUrl?.startsWith("data:image")) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[VerifyStep] Gemini: completed=${parsed.completed}, confidence=${parsed.confidence}`);
      
      return NextResponse.json({
        success: true,
        completed: parsed.completed === true,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
        reason: parsed.reason || "Verificación completada",
        nextHint: parsed.nextHint,
      });
    }

    // Fallback if no JSON
    return NextResponse.json({
      success: true,
      completed: responseText.toLowerCase().includes("true"),
      confidence: 50,
      reason: "No se pudo parsear respuesta estructurada",
    });

  } catch (error) {
    console.error("[VerifyStep] Error:", error);
    return NextResponse.json({
      success: false,
      completed: false,
      confidence: 0,
      reason: error instanceof Error ? error.message : "Error de verificación",
    });
  }
}
