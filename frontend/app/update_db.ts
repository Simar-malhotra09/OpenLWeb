const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
  type: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
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

    // Step 1: Create or update all nodes
    console.log("Updating nodes...");
    await Promise.all(
      jsonData.nodes.map((node) =>
        prisma.node.upsert({
          where: { id: node.id },
          update: {
            user: node.user,
            title: node.title,
            link: node.link,
          },
          create: {
            id: node.id,
            user: node.user,
            title: node.title,
            link: node.link,
          },
        })
      )
    );

    // Step 2: Create links, but prevent duplicates
    console.log("Creating links...");
    const linkResults = await Promise.allSettled(
      jsonData.links.map(async (link) => {
        // Check if link already exists
        const exists = await prisma.link.findFirst({
          where: {
            sourceId: link.source,
            targetId: link.target,
          },
        });

        if (!exists) {
          await prisma.link.create({
            data: {
              source: { connect: { id: link.source } },
              target: { connect: { id: link.target } },
              // type: link.type, // Uncomment if you add a 'type' field in schema
            },
          });
        } else {
          console.log(`Link from ${link.source} → ${link.target} already exists. Skipping.`);
        }
      })
    );

    // Log failures if any
    linkResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const link = jsonData.links[index];
        console.error(`Failed to create link ${link.source} → ${link.target}:`, result.reason);
      }
    });

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
