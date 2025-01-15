"use client";

import { useEffect, useState } from "react";

interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[]; // Fixed the typo here
  links: Link[];
}

export default function Page() {
  const [data, setData] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Network response was not ok");
        const json: GraphData = await res.json(); // Ensure proper type checking
        console.log(json);
        setData(json.nodes || []);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Show Data</h1>
      <div className="space-y-4">
        {data.map((node) => (
          <div key={node.id} className="border p-4 rounded">
            <p>Id: {node.id || "Unknown id"}</p>
            <p>User: {node.user || "Unknown User"}</p>
            <p>Title: {node.title || "No title provided"}</p>
            {node.link ? (
              <p>
                Link:{" "}
                <a href={node.link} className="text-blue-500 underline">
                  {node.link}
                </a>
              </p>
            ) : (
              <p>
                Link:{" "}
                <a href={node.link} className="text-red-500 underline">
                  {node.link}
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
