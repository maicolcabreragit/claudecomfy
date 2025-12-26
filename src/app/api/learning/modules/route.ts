/**
 * Learning Modules API
 * POST /api/learning/modules - Create or find existing module
 * GET /api/learning/modules - List user's modules
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | null = null;
function getPrisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// Simple topic similarity check
function topicsAreSimilar(topic1: string, topic2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words1 = new Set(normalize(topic1).split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(normalize(topic2).split(/\s+/).filter(w => w.length > 3));
  
  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }
  
  return overlap >= 2 || (words1.size <= 2 && overlap >= 1);
}

// GET - List modules
export async function GET() {
  try {
    const prisma = getPrisma();
    
    const modules = await prisma.learningModule.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        units: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      modules,
    });
  } catch (error) {
    console.error("[Learning] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST - Create or find existing module
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    
    const { topic, title, conversationId } = body;
    
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Check for existing similar module
    const existingModules = await prisma.learningModule.findMany({
      where: { status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    for (const existing of existingModules) {
      if (topicsAreSimilar(topic, existing.topic)) {
        // Update timestamp to mark as recently used
        await prisma.learningModule.update({
          where: { id: existing.id },
          data: { updatedAt: new Date() },
        });
        
        return NextResponse.json({
          success: true,
          module: existing,
          isExisting: true,
        });
      }
    }

    // Create new module
    const moduleTitle = title || `Aprendiendo: ${topic}`;
    
    const newModule = await prisma.learningModule.create({
      data: {
        title: moduleTitle,
        topic,
        description: body.description || null,
        conversationId,
        isManual: body.isManual || false,
      },
    });

    console.log(`[Learning] Created module: ${newModule.id} - ${topic}`);

    return NextResponse.json({
      success: true,
      module: newModule,
      isExisting: false,
    });

  } catch (error) {
    console.error("[Learning] POST Error:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
