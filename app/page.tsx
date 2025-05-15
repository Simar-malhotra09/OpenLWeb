"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// Dynamically import ForceGraph3D (avoids SSR issues)
const ForceGraph3D = dynamic(() => import("react-force-graph").then(mod => mod.ForceGraph3D), {
  ssr: false,
});

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

export default function Page() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const res = await fetch("/api/get_data_from_endpoint", { method: "POST" });
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.json();
        if (!data.nodes || !data.links) {
          throw new Error("Invalid graph data format");
        }
        setGraphData(data);
      } catch (err: any) {
        console.error("Error fetching graph data:", err);
        setError(err.message || "Failed to load graph");
      }
    };
    fetchGraphData();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {graphData ? (
        <ForceGraph3D
          graphData={graphData}
          backgroundColor="black"
          nodeLabel={(node: any) => `${node.user}: ${node.title}`}
          nodeColor={(node: any) =>
            node.type === "[TAG]" ? "red" : "white"
          }
          nodeRelSize={6}
          nodeAutoColorBy="user"
          linkColor={(link: any) => 
            link.type === "[TAG]" ? "red" : "white"
          }
          linkOpacity={0.9}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={() => 0.5}
          linkDirectionalParticleWidth={() => 1}
          linkDirectionalParticleColor={(link: any) => 
            link.type === "[TAG]" ? "red" : "blue"
          }
          onNodeRightClick={(node: any) => {
            if (node.link) {
              window.open(node.link, "_blank");
            }
          }}
        />
      ) : (
        <div>Loading graph...</div>
      )}
    </div>
  );
}
