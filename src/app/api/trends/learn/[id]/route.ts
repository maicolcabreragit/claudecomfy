/**
 * GET /api/trends/learn/[id] - Get specific digest by ID
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    const digest = await prisma.trendDigest.findUnique({
      where: { id },
    });

    if (!digest) {
      return NextResponse.json(
        { error: "Digest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      digest,
    });
  } catch (error) {
    console.error("[Learn/ID] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}
