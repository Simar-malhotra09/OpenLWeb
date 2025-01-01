import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id, user, description } = await request.json();

    const newNode = await prisma.node.create({
      data: {
        id,
        user,
        description,
      },
    });

    return NextResponse.json(
      { message: "Data added successfully", newNode },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding data:", error);
    return NextResponse.json({ error });
  }
}

export async function GET() {
  const nodes = await prisma.node.findMany({
    include: {
      sourceLinks: true,
      targetLinks: true,
    },
  });

  const links = await prisma.link.findMany();

  const graphData = {
    nodes: nodes.map((node) => ({
      id: node.id,
      user: node.user,
      description: node.description,
    })),
    links: links.map((link) => ({
      source: link.source,
      target: link.target,
    })),
  };

  return new Response(JSON.stringify(graphData), {
    headers: { "Content-Type": "application/json" },
  });
}
