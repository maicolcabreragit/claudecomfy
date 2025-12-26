/**
 * ElevenLabs Preview API
 * POST /api/elevenlabs/preview - Generate short audio preview
 * 
 * Body: { text: string, voiceId: string, settings?: VoiceSettings }
 * Returns: base64 audio (first ~500 chars)
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getElevenLabsService, 
  PODCAST_VOICE_SETTINGS,
  type VoiceSettings 
} from "@/lib/elevenlabs";

interface PreviewRequest {
  text: string;
  voiceId: string;
  settings?: VoiceSettings;
}

export async function POST(req: NextRequest) {
  try {
    const body: PreviewRequest = await req.json();
    
    if (!body.text || !body.voiceId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: text and voiceId",
      }, { status: 400 });
    }

    const service = getElevenLabsService();
    
    // Estimate credits for preview
    const previewText = body.text.slice(0, 500);
    const estimatedCredits = service.estimateCredits(previewText);
    
    // Generate preview audio
    const audioBuffer = await service.generatePreview(
      body.text,
      body.voiceId,
      body.settings || PODCAST_VOICE_SETTINGS
    );

    // Convert to base64
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      duration: service.estimateDuration(previewText),
      creditsUsed: estimatedCredits,
      previewLength: previewText.length,
    });

  } catch (error) {
    console.error("[Preview API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
