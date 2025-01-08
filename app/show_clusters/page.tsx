"use client";
import { useEffect, useState } from "react";

interface ClustersResponse {
  cluster_heads: { [key: string]: string };
}

interface Clusters {
  header: string;
}

export default function ShowClustersPage() {
  const [clusters, setClusters] = useState<Clusters[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/clusters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch clusters");
        }

        // Parse the response JSON
        const data: ClustersResponse = await res.json();

        // Convert the object into an array of clusters
        const clustersArray = Object.values(data.cluster_heads).map(
          (header: string) => ({
            header,
          })
        );

        setClusters(clustersArray);
      } catch (err) {
        setError("Failed to load clusters");
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clusters</h1>
      <div className="space-y-4">
        {clusters.map((cluster, idx) => (
          <div key={idx} className="border p-4 rounded">
            <p>{cluster.header}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
