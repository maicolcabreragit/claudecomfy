/**
 * Vision OCR API endpoint
 * POST /api/extension/ocr
 * 
 * Extracts text from screenshots using Google Cloud Vision API
 * Much cheaper than sending images to Claude
 */

import { NextRequest, NextResponse } from "next/server";

// Lazy load Vision client
let visionClient: import("@google-cloud/vision").ImageAnnotatorClient | null = null;

async function getVisionClient() {
  if (!visionClient) {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

interface OCRResult {
  success: boolean;
  fullText: string;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  elements: Array<{
    type: "button" | "input" | "link" | "text";
    label: string;
  }>;
}

export async function POST(req: NextRequest): Promise<NextResponse<OCRResult | { error: string }>> {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Check if Vision API is configured
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log("[OCR] No Google Cloud credentials configured");
      return NextResponse.json({
        success: false,
        fullText: "",
        blocks: [],
        elements: [],
      });
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const client = await getVisionClient();
    
    // Perform document text detection (optimized for dense text)
    const [result] = await client.documentTextDetection({
      image: { content: base64Data },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    const fullText = fullTextAnnotation?.text || "";
    
    // Extract blocks with confidence
    const blocks: OCRResult["blocks"] = [];
    if (fullTextAnnotation?.pages) {
      for (const page of fullTextAnnotation.pages) {
        for (const block of page.blocks || []) {
          const blockText = block.paragraphs
            ?.map(p => p.words?.map(w => w.symbols?.map(s => s.text).join("")).join(" ")).join("\n") || "";
          
          if (blockText.trim()) {
            blocks.push({
              text: blockText,
              confidence: block.confidence || 0,
            });
          }
        }
      }
    }

    // Detect UI elements from text patterns
    const elements: OCRResult["elements"] = [];
    
    // Button patterns
    const buttonPatterns = /\b(submit|save|cancel|ok|confirm|next|continue|login|sign in|sign up|create|delete|edit|update|download|upload)\b/gi;
    let match;
    while ((match = buttonPatterns.exec(fullText)) !== null) {
      elements.push({ type: "button", label: match[0] });
    }

    // Link patterns
    const linkPatterns = /https?:\/\/[^\s]+/g;
    while ((match = linkPatterns.exec(fullText)) !== null) {
      elements.push({ type: "link", label: match[0] });
    }

    console.log(`[OCR] Extracted ${fullText.length} chars, ${blocks.length} blocks, ${elements.length} elements`);

    return NextResponse.json({
      success: true,
      fullText: fullText.slice(0, 2000), // Limit for efficiency
      blocks: blocks.slice(0, 10),
      elements: elements.slice(0, 20),
    });

  } catch (error) {
    console.error("[OCR] Error:", error);
    return NextResponse.json({
      success: false,
      fullText: "",
      blocks: [],
      elements: [],
    });
  }
}
