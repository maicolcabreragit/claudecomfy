/**
 * ElevenLabs Generate API
 * POST /api/elevenlabs/generate - Generate full audio from text
 * 
 * Body: { text: string, voiceId: string, settings?: VoiceSettings, saveToFile?: boolean }
 * Returns: base64 audio or file path
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { 
  getElevenLabsService, 
  PODCAST_VOICE_SETTINGS,
  type VoiceSettings,
  formatDuration,
  formatFileSize,
} from "@/lib/elevenlabs";

interface GenerateRequest {
  text: string;
  voiceId: string;
  settings?: VoiceSettings;
  filename?: string;  // Optional: save to file with this name
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    
    if (!body.text || !body.voiceId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: text and voiceId",
      }, { status: 400 });
    }

    const service = getElevenLabsService();
    
    // Estimate before generating
    const estimatedCredits = service.estimateCredits(body.text);
    const estimatedDuration = service.estimateDuration(body.text);
    
    console.log(`[Generate API] Starting generation: ${body.text.length} chars, ~${estimatedCredits} credits, ~${formatDuration(estimatedDuration)}`);

    // Generate audio
    const audioBuffer = await service.generateSpeech({
      voiceId: body.voiceId,
      text: body.text,
      settings: body.settings || PODCAST_VOICE_SETTINGS,
    });

    console.log(`[Generate API] Generated ${formatFileSize(audioBuffer.length)} audio`);

    // Save to file if filename provided
    if (body.filename) {
      const podcastsDir = join(process.cwd(), "public", "podcasts");
      
      // Ensure directory exists
      await mkdir(podcastsDir, { recursive: true });
      
      // Sanitize filename
      const safeFilename = body.filename
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .toLowerCase();
      const filepath = join(podcastsDir, `${safeFilename}.mp3`);
      
      await writeFile(filepath, audioBuffer);
      
      return NextResponse.json({
        success: true,
        filepath: `/podcasts/${safeFilename}.mp3`,
        fileSize: audioBuffer.length,
        duration: estimatedDuration,
        creditsUsed: estimatedCredits,
      });
    }

    // Return as base64
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      audioSize: audioBuffer.length,
      duration: estimatedDuration,
      creditsUsed: estimatedCredits,
    });

  } catch (error) {
    console.error("[Generate API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    // Check for specific errors
    if (message.includes("rate limit") || message.includes("429")) {
      return NextResponse.json({
        success: false,
        error: "Rate limit exceeded. Please wait a moment and try again.",
        retryAfter: 60,
      }, { status: 429 });
    }
    
    if (message.includes("quota") || message.includes("credits")) {
      return NextResponse.json({
        success: false,
        error: "Not enough credits. Please check your ElevenLabs subscription.",
      }, { status: 402 });
    }
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
