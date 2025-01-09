import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { id, user, title } = await request.json();

    const newNode = await prisma.node.create({
      data: {
        id,
        user,
        title,
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
  try {
    // Fetch nodes and include related links
    const nodes = await prisma.node.findMany({
      include: {
        sourceLinks: true,
        targetLinks: true,
      },
    });

    // Fetch links
    const links = await prisma.link.findMany();

    // Format the data for the graph
    const graphData = {
      nodes: nodes.map((node) => ({
        id: node.id,
        user: node.user || "unknown user",
        title: node.title || "No description provided",
      })),
      links: links.map((link) => ({
        source: link.sourceId,
        target: link.targetId,
      })),
    };

    return new Response(JSON.stringify(graphData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch graph data." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
