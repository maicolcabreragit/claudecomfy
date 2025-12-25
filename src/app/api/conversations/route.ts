import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TODO: Get userId from auth session
const DEFAULT_USER_ID = "62fea1f0-fb76-4b86-8bbb-be46d38a5161";

// GET: Fetch all conversations for the current user, optionally filtered by project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // Solo primer mensaje para preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[API] Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation
export async function POST(req: Request) {
  try {
    const { title, projectId } = await req.json();

    const conversation = await prisma.conversation.create({
      data: {
        title: title || "Nueva conversación",
        userId: DEFAULT_USER_ID,
        projectId: projectId || null,
      },
    });

    console.log(`[API] Created conversation: ${conversation.id}`);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a conversation
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    console.log(`[API] Deleted conversation: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Failed to delete conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
