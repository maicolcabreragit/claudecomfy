/**
 * ElevenLabs Credits API
 * GET /api/elevenlabs/credits - Get remaining credits info
 */

import { NextResponse } from "next/server";
import { getElevenLabsService } from "@/lib/elevenlabs";

export async function GET() {
  try {
    const service = getElevenLabsService();
    const credits = await service.getRemainingCredits();

    return NextResponse.json({
      success: true,
      remaining: credits.remaining,
      total: credits.total,
      used: credits.total - credits.remaining,
      usagePercent: Math.round(((credits.total - credits.remaining) / credits.total) * 100),
      resetDate: credits.resetDate.toISOString(),
    });

  } catch (error) {
    console.error("[Credits API] Error:", error);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}
