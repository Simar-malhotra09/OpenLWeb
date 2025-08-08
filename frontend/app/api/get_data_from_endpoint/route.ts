import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("Calling FastAPI...");

    const res = await fetch("http://127.0.0.1:8000/expose_json_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("FastAPI responded with status:", res.status);

    const text = await res.text();
    console.log("Raw response text from FastAPI:", text);

    if (!res.ok) {
      throw new Error("FastAPI returned an error status");
    }

    const data = JSON.parse(text); // in case it's not valid JSON

    if (!data.nodes || !data.links) {
      throw new Error("Malformed graph data from FastAPI");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
