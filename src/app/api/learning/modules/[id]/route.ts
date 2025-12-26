/**
 * Learning Module Individual API
 * GET /api/learning/modules/[id] - Get single module with units
 * PATCH /api/learning/modules/[id] - Update module (title, description, status)
 * DELETE /api/learning/modules/[id] - Delete module and its units
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

// GET - Get single module with units
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    const module = await prisma.learningModule.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      module,
    });
  } catch (error) {
    console.error("[Learning] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}

// PATCH - Update module
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const body = await req.json();

    const { title, description, status } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const module = await prisma.learningModule.update({
      where: { id },
      data: updateData,
      include: {
        units: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      module,
    });
  } catch (error) {
    console.error("[Learning] PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE - Delete module and all its units
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    // Delete module (units will cascade delete due to onDelete: Cascade)
    await prisma.learningModule.delete({
      where: { id },
    });

    console.log(`[Learning] Deleted module: ${id}`);

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error("[Learning] DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
