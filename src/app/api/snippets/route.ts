import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for creating snippets
const CreateSnippetSchema = z.object({
  trigger: z
    .string()
    .min(2)
    .max(50)
    .regex(/^\/[\w-]+$/, "Trigger must start with / and contain only letters, numbers, or hyphens"),
  content: z.string().min(1).max(10000),
  type: z.enum(["PROMPT", "CODE", "FIX"]),
  tags: z.array(z.string()).optional().default([]),
});

// GET: Fetch all snippets for the current user
export async function GET() {
  try {
    // TODO: Get userId from auth session
    const userId = "62fea1f0-fb76-4b86-8bbb-be46d38a5161"; // Admin user from seed

    const snippets = await prisma.snippet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trigger: true,
        content: true,
        type: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("[API] Failed to fetch snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}

// POST: Create a new snippet
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = CreateSnippetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { trigger, content, type, tags } = validationResult.data;

    // TODO: Get userId from auth session
    const userId = "62fea1f0-fb76-4b86-8bbb-be46d38a5161";

    // Check if trigger already exists for this user
    const existing = await prisma.snippet.findUnique({
      where: { userId_trigger: { userId, trigger } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Trigger "${trigger}" already exists` },
        { status: 409 }
      );
    }

    const snippet = await prisma.snippet.create({
      data: {
        trigger,
        content,
        type,
        tags,
        userId,
      },
    });

    console.log(`[API] Created snippet: ${trigger} (${type})`);
    return NextResponse.json({ snippet }, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a snippet by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Snippet ID is required" },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = "62fea1f0-fb76-4b86-8bbb-be46d38a5161";

    // Verify ownership before deleting
    const snippet = await prisma.snippet.findFirst({
      where: { id, userId },
    });

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    await prisma.snippet.delete({ where: { id } });

    console.log(`[API] Deleted snippet: ${snippet.trigger}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete snippet:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 }
    );
  }
}
