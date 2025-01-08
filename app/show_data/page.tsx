"use client";
import { useEffect, useState } from "react";

interface Node {
  id: string;
  user: string;
  description: string;
}

export default function Page() {
  const [data, setData] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        const json = await res.json();
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
            <p>{node.user || "Unknown User"}</p>
            <p>{node.description || "No description provided"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
