"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        const json = await res.json();
        setData(json);
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
        {data.map((item) => (
          <div key={item.id} className="border p-4 rounded">
            {/* Adjust these fields based on your data structure */}
            <p>{item.user}</p>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
