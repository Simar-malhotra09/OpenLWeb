import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const decodedQuery = decodeURIComponent(query);
  let url: string;

  // Try to detect DOI regardless of prefix
  const doiMatch = decodedQuery.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);

  if (doiMatch) {
    url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(
      doiMatch[0]
    )}?fields=title,authors,abstract,venue,year,externalIds&limit=1`;
  } else if (decodedQuery.startsWith('DOI:')) {
    const doi = decodedQuery.substring(4);
    url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(
      doi
    )}?fields=title,authors,abstract,venue,year,externalIds&limit=1`;
  } else {
    url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
      decodedQuery
    )}&fields=title,authors,abstract,venue,year&limit=1`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY as string,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Semantic Scholar API error: ${res.status} ${res.statusText} | URL: ${url} | Query: ${query} | Response: ${errorText}`
      );
    }

    const data = await res.json();

    // If DOI match and direct object, wrap in array for consistency
    if (doiMatch && data.title) {
      return NextResponse.json({ data: [data] });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Semantic Scholar fetch failed:', err);
    return NextResponse.json(
      { error: `Failed to fetch paper data: ${err.message}` },
      { status: 500 }
    );
  }
}

