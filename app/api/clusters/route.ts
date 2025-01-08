import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Fetch data from FastAPI endpoint
    const res = await fetch("http://127.0.0.1:8000/analyze_clusters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch clusters data");
    }

    const data = await res.json();

    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch clusters data" },
      { status: 500 }
    );
  }
}
