/**
 * Google Cloud Vision API endpoint for screenshot analysis
 * POST /api/extension/verify
 * 
 * Uses Vision API to extract text (OCR) from screenshots
 * and verify if the user completed the expected step
 */

import { NextRequest, NextResponse } from "next/server";

// Vision API client - lazy loaded
let visionClient: import("@google-cloud/vision").ImageAnnotatorClient | null = null;

async function getVisionClient() {
  if (!visionClient) {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

interface VerifyRequest {
  image: string; // base64 data URL
  expectedText?: string; // Text that should be visible
  expectedElements?: string[]; // UI elements to look for
}

// POST - Analyze screenshot with Vision API
export async function POST(req: NextRequest) {
  try {
    const body: VerifyRequest = await req.json();
    const { image, expectedText, expectedElements } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Check if Vision API is configured
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
      // Fallback: Return success without verification (Claude will verify)
      console.log("[ComfyLink Vision] No Google Cloud credentials, skipping verification");
      return NextResponse.json({ 
        success: true, 
        verified: null,
        message: "Vision API not configured - Claude will verify",
      });
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const client = await getVisionClient();
    
    // Perform text detection (OCR)
    const [result] = await client.textDetection({
      image: { content: base64Data },
    });

    const detections = result.textAnnotations || [];
    const fullText = detections[0]?.description || "";

    console.log(`[ComfyLink Vision] Detected ${detections.length} text regions`);

    // Verify if expected content is present
    let verified = true;
    const matches: string[] = [];
    const missing: string[] = [];

    if (expectedText) {
      if (fullText.toLowerCase().includes(expectedText.toLowerCase())) {
        matches.push(expectedText);
      } else {
        missing.push(expectedText);
        verified = false;
      }
    }

    if (expectedElements) {
      for (const element of expectedElements) {
        if (fullText.toLowerCase().includes(element.toLowerCase())) {
          matches.push(element);
        } else {
          missing.push(element);
          verified = false;
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      extractedText: fullText.slice(0, 500), // Limit for token efficiency
      matches,
      missing,
      textRegions: detections.length,
    });

  } catch (error) {
    console.error("[ComfyLink Vision] Error:", error);
    
    // If Vision API fails, return graceful fallback
    return NextResponse.json({ 
      success: true, 
      verified: null,
      message: "Vision API unavailable - Claude will verify",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
