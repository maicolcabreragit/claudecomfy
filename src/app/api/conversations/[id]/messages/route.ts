import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Add a message to a conversation
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: conversationId } = await params;
    const { role, content, reasoning, images } = await req.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        reasoning: reasoning || null,
        images: images || [],
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Auto-generate title from first message if not set
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { title: true },
    });

    if (conversation?.title === "Nueva conversación" && role === "user") {
      const autoTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title: autoTitle },
      });
    }

    console.log(`[API] Saved message to conversation: ${conversationId}`);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to save message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
