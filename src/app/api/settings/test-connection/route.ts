/**
 * POST /api/settings/test-connection - Test API key connection
 */

import { NextRequest, NextResponse } from "next/server";

interface TestConnectionBody {
  provider: "ANTHROPIC" | "OPENROUTER";
  apiKey: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TestConnectionBody = await req.json();
    const { provider, apiKey } = body;

    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: "Missing provider or apiKey" },
        { status: 400 }
      );
    }

    if (provider === "OPENROUTER") {
      // Test OpenRouter connection
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { 
            success: false, 
            error: "OpenRouter authentication failed",
            details: error 
          },
          { status: 401 }
        );
      }

      const data = await response.json();
      const models = data.data?.slice(0, 20).map((m: { id: string; name: string }) => ({
        id: m.id,
        name: m.name || m.id,
      })) || [];

      return NextResponse.json({
        success: true,
        provider: "OPENROUTER",
        models,
        message: "Conexión exitosa con OpenRouter",
      });
    }

    if (provider === "ANTHROPIC") {
      // Test Anthropic connection with a minimal request
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      // A successful response or rate limit means the key is valid
      if (response.ok || response.status === 429) {
        return NextResponse.json({
          success: true,
          provider: "ANTHROPIC",
          models: [
            { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
            { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
            { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
            { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
          ],
          message: "Conexión exitosa con Anthropic",
        });
      }

      const error = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          error: "Anthropic authentication failed",
          details: error 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Invalid provider" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Test Connection] Error:", error);
    return NextResponse.json(
      { error: "Connection test failed", details: String(error) },
      { status: 500 }
    );
  }
}
