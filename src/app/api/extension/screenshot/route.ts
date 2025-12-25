/**
 * API endpoint to receive screenshots from ComfyLink extension
 * POST /api/extension/screenshot
 */

import { NextRequest, NextResponse } from "next/server";

// Store screenshots in memory temporarily (in production, use a proper queue)
const screenshotQueue: Array<{
  id: string;
  image: string;
  url: string;
  timestamp: number;
}> = [];

// GET - Retrieve pending screenshots for the chat
export async function GET() {
  const screenshots = [...screenshotQueue];
  screenshotQueue.length = 0; // Clear the queue
  
  return NextResponse.json({ screenshots });
}

// POST - Receive screenshot from extension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, url } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const screenshot = {
      id: `ss-${Date.now()}`,
      image,
      url: url || "",
      timestamp: Date.now(),
    };

    screenshotQueue.push(screenshot);
    console.log(`[ComfyLink] Screenshot received from ${url || "unknown"}`);

    return NextResponse.json({ 
      success: true, 
      id: screenshot.id 
    });
  } catch (error) {
    console.error("[ComfyLink] Error receiving screenshot:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
