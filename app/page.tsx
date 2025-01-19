"use client";

import { useEffect, useState } from "react";
import { ForceGraph3D } from "react-force-graph";

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

export default function Page() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      const res = await fetch("/api/data");
      const data = await res.json();
      setGraphData(data);
    };

    fetchGraphData();
  }, []);

  const emitParticles = (link: Link) => {
    return {
      particleSpeed: 0.5,
      particleWidth: 1,
      particleColor: "red",
    };
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {graphData ? (
        <ForceGraph3D
          graphData={graphData}
          backgroundColor="black"
          nodeLabel={(node) => `${node.user}: ${node.title}`}
          nodeColor={(node) => {
            // Check if node.id is numeric or a UID
            return /^[0-9]+$/.test(node.id) ? "red" : "white";
          }}
          nodeRelSize={6}
          nodeAutoColorBy="user"
          linkColor="red"
          linkOpacity={0.9}
          linkDirectionalParticles={1} // Enables particle emission
          linkCurvature={0}
          // Emit particles when links are interacted with
          linkDirectionalParticleSpeed={(link) =>
            emitParticles(link).particleSpeed
          } // Controls particle speed
          linkDirectionalParticleWidth={(link) =>
            emitParticles(link).particleWidth
          } // Controls particle width
          linkDirectionalParticleColor={(link) =>
            emitParticles(link).particleColor
          } // Controls particle color
          onNodeRightClick={(node) => {
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
