"use client";

import { useEffect, useState } from "react";
import { ForceGraph3D } from "react-force-graph";

type Node = {
  id: string;
  user: string;
  description: string;
};

type Link = {
  source: string;
  target: string;
};

type GraphData = {
  nodes: Node[];
  links: Link[];
};

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

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {graphData ? (
        <ForceGraph3D
          graphData={graphData}
          nodeLabel={(node) => `${node.user}: ${node.description}`}
          nodeAutoColorBy="user"
          linkDirectionalParticles={1}
        />
      ) : (
        <div>Loading graph...</div>
      )}
    </div>
  );
}
