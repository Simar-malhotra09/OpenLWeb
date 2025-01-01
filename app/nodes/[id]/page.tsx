import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NodePageProps {
  params: { id: string };
}

export default async function NodePage({ params }: NodePageProps) {
  const { id } = params;

  const nodeWithOutgoingLinks = await prisma.node.findUnique({
    where: { id: "article2" },
    include: {
      sourceLinks: {
        include: { sourceNode: true }, // Include the target node's details
      },
    },
  });

  if (!nodeWithOutgoingLinks) {
    return <div>Node with ID "{id}" not found.</div>;
  }

  return (
    <div>
      <h1>Node Details</h1>
      <p>
        <strong>ID:</strong> {nodeWithOutgoingLinks.id}
      </p>
      <p>
        <strong>User:</strong> {nodeWithOutgoingLinks.user}
      </p>
      <p>
        <strong>Description:</strong> {nodeWithOutgoingLinks.description}
      </p>

      <h2>Outgoing Links</h2>
      {nodeWithOutgoingLinks.sourceLinks.length > 0 ? (
        <ul>
          {nodeWithOutgoingLinks.sourceLinks.map((link) => (
            <li key={link.id}>
              <p>
                <strong>Link ID:</strong> {link.id}
              </p>
              <p>
                <strong>Target Node:</strong>{" "}
                {link.sourceNode?.description || "Unknown"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No outgoing links found for this node.</p>
      )}
    </div>
  );
}
