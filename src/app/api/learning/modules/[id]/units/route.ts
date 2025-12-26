/**
 * Learning Module Units API
 * POST /api/learning/modules/[id]/units - Add units to module
 * PATCH /api/learning/modules/[id]/units - Update unit status
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

// POST - Add units from detected tasks
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const prisma = getPrisma();
    const body = await req.json();
    
    const { units } = body; // Array of { title: string }
    
    if (!Array.isArray(units) || units.length === 0) {
      return NextResponse.json({ error: "Units array is required" }, { status: 400 });
    }

    // Verify module exists
    const module = await prisma.learningModule.findUnique({
      where: { id: moduleId },
      include: { units: true },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get current max order
    const maxOrder = module.units.length > 0 
      ? Math.max(...module.units.map(u => u.order)) 
      : -1;

    // Create new units
    const createdUnits = await prisma.learningUnit.createMany({
      data: units.map((unit: { title: string }, index: number) => ({
        moduleId,
        title: unit.title,
        order: maxOrder + 1 + index,
      })),
    });

    console.log(`[Learning] Added ${createdUnits.count} units to module ${moduleId}`);

    // Fetch updated module
    const updatedModule = await prisma.learningModule.findUnique({
      where: { id: moduleId },
      include: { units: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      module: updatedModule,
      unitsAdded: createdUnits.count,
    });

  } catch (error) {
    console.error("[Learning/Units] POST Error:", error);
    return NextResponse.json({ error: "Failed to add units" }, { status: 500 });
  }
}

// PATCH - Update unit completion status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const prisma = getPrisma();
    const body = await req.json();
    
    const { unitId, completed } = body;
    
    if (!unitId) {
      return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    }

    // Update unit
    await prisma.learningUnit.update({
      where: { id: unitId },
      data: { completed: completed ?? true },
    });

    // Recalculate module progress
    const allUnits = await prisma.learningUnit.findMany({
      where: { moduleId },
    });

    const completedCount = allUnits.filter(u => u.completed).length;
    const progress = allUnits.length > 0 
      ? Math.round((completedCount / allUnits.length) * 100)
      : 0;

    // Update module progress and status
    const status = progress === 100 ? "COMPLETED" : "ACTIVE";
    
    const updatedModule = await prisma.learningModule.update({
      where: { id: moduleId },
      data: { progress, status },
      include: { units: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({
      success: true,
      module: updatedModule,
      progress,
    });

  } catch (error) {
    console.error("[Learning/Units] PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}
