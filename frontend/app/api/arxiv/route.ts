import { NextResponse } from "next/server";
import { fetchFromArxivById } from "../../lib/utils/additional-node-info";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const link = searchParams.get("link");

  if (!link) {
    return NextResponse.json({ error: "Missing link" }, { status: 400 });
  }

  const whitePaper = await fetchFromArxivById(link);

  if (!whitePaper) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(whitePaper);
}

