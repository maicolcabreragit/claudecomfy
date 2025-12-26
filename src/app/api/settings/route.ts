/**
 * GET /api/settings - Get user settings
 * PUT /api/settings - Update user settings
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, AIProvider, Theme, Language } from "@prisma/client";
import { encryptApiKey } from "@/lib/encryption";

const prisma = new PrismaClient();

// Default user ID (until auth is implemented)
const DEFAULT_USER_ID = "default-user";

export async function GET() {
  try {
    // Get or create settings for user
    let settings = await prisma.userSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
    });

    if (!settings) {
      // Ensure user exists
      await prisma.user.upsert({
        where: { id: DEFAULT_USER_ID },
        update: {},
        create: { id: DEFAULT_USER_ID, email: "user@comfyclaude.local" },
      });

      // Create default settings
      settings = await prisma.userSettings.create({
        data: { userId: DEFAULT_USER_ID },
      });
    }

    // Return settings (without exposing encrypted keys directly)
    return NextResponse.json({
      aiProvider: settings.aiProvider,
      preferredModel: settings.preferredModel,
      hasOpenrouterKey: !!settings.openrouterApiKey,
      hasAnthropicKey: !!settings.anthropicApiKey,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      theme: settings.theme,
      language: settings.language,
    });
  } catch (error) {
    console.error("[Settings API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

interface UpdateSettingsBody {
  aiProvider?: AIProvider;
  preferredModel?: string;
  openrouterApiKey?: string; // Plain text, will be encrypted
  anthropicApiKey?: string;  // Plain text, will be encrypted
  temperature?: number;
  maxTokens?: number;
  theme?: Theme;
  language?: Language;
}

export async function PUT(req: NextRequest) {
  try {
    const body: UpdateSettingsBody = await req.json();

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (body.aiProvider) {
      updateData.aiProvider = body.aiProvider;
    }

    if (body.preferredModel) {
      updateData.preferredModel = body.preferredModel;
    }

    // Encrypt OpenRouter key if provided
    if (body.openrouterApiKey) {
      const encrypted = encryptApiKey(body.openrouterApiKey);
      updateData.openrouterApiKey = encrypted.encrypted;
      updateData.openrouterKeyIv = encrypted.iv;
    }

    // Encrypt Anthropic key if provided
    if (body.anthropicApiKey) {
      const encrypted = encryptApiKey(body.anthropicApiKey);
      updateData.anthropicApiKey = encrypted.encrypted;
      updateData.anthropicKeyIv = encrypted.iv;
    }

    if (typeof body.temperature === "number") {
      updateData.temperature = Math.max(0, Math.min(1, body.temperature));
    }

    if (typeof body.maxTokens === "number") {
      updateData.maxTokens = Math.max(256, Math.min(8192, body.maxTokens));
    }

    if (body.theme) {
      updateData.theme = body.theme;
    }

    if (body.language) {
      updateData.language = body.language;
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: updateData,
      create: {
        userId: DEFAULT_USER_ID,
        ...updateData,
      } as Parameters<typeof prisma.userSettings.create>[0]["data"],
    });

    return NextResponse.json({
      success: true,
      aiProvider: settings.aiProvider,
      preferredModel: settings.preferredModel,
      hasOpenrouterKey: !!settings.openrouterApiKey,
      hasAnthropicKey: !!settings.anthropicApiKey,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      theme: settings.theme,
      language: settings.language,
    });
  } catch (error) {
    console.error("[Settings API] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

