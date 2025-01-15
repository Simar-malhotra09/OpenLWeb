const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
  sourceLinks: Link[];
  targetLinks: Link[];
}

interface Link {
  source: string;
  target: string;
  sourceNode: Node;
  targetNode: Node;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

async function updateDatabaseFromJSON() {
  try {
    const data = fs.readFileSync(
      path.join(process.cwd(), "public", "cluster_data.json"),
      "utf-8"
    );
    const jsonData: GraphData = JSON.parse(data);

    // First, create or update all nodes
    console.log("Updating nodes...");
    await Promise.all(
      jsonData.nodes.map((node) =>
        prisma.node.upsert({
          where: { id: node.id },
          update: {
            user: node.user,
            title: node.title,
            link: node.link
          },
          create: {
            id: node.id,
            user: node.user,
            title: node.title,
            link: node.link
          },
        })
      )
    );

    // Then create or update all links
    console.log("Updating links...");
    await Promise.all(
      jsonData.links.map((link) =>
        prisma.link
          .create({
            data: {
              source: {
                connect: { id: link.source },
              },
              target: {
                connect: { id: link.target },
              },
            },
          })
          .catch((error: unknown) => {
            if (error instanceof Error) {
              console.error("Error:", error.message);
            } else {
              console.error("Unknown error:", error);
            }
          })
      )
    );

    console.log("Database updated successfully!");
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateDatabaseFromJSON().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
