import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all projects for the current user
export async function GET() {
  try {
    // TODO: Get userId from auth session
    const userId = "62fea1f0-fb76-4b86-8bbb-be46d38a5161"; // Admin user from seed

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        _count: {
          select: { conversations: true },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[API] Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST: Create a new project
export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = "62fea1f0-fb76-4b86-8bbb-be46d38a5161";

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
