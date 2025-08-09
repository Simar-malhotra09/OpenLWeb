interface WhitePaper {
  title: string;
  author: string;
  abstract: string;
  publisher: string;
  date: string;
}
async function fetchFromSemanticScholarByDOI(doi: string): Promise<WhitePaper | null> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=title,authors,abstract,venue,year`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const paper = await res.json();
    if (!paper) return null;
    return {
      title: paper.title || "",
      author: paper.authors?.map((a: any) => a.name).join(", ") || "",
      abstract: paper.abstract || "",
      publisher: paper.venue || "",
      date: paper.year ? paper.year.toString() : "",
      doi,
    };
  } catch {
    return null;
  }
}

async function fetchFromSemanticScholarByTitle(title: string): Promise<WhitePaper | null> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&fields=title,authors,abstract,venue,year&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    
    const paper = data.data[0];
    return {
      title: paper.title || "",
      author: paper.authors?.map((a: any) => a.name).join(", ") || "",
      abstract: paper.abstract || "",
      publisher: paper.venue || "",
      date: paper.year ? paper.year.toString() : "",
    };
  } catch {
    return null;
  }
}

async function fetchFromCrossRef(title: string): Promise<WhitePaper | null> {
  const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.message.items || data.message.items.length === 0) return null;
    
    const item = data.message.items[0];
    return {
      title: item.title?.[0] || "",
      author: item.author?.map((a: any) => a.given + " " + a.family).join(", ") || "",
      abstract: item.abstract || "",
      publisher: item.publisher || "",
      date: item.published?.["date-parts"]?.[0]?.join("-") || "",
      doi: item.DOI || undefined,
    };
  } catch {
    return null;
  }
}
export async function getPaperData(title: string): Promise<WhitePaper | null> {
  // it seems to be the case that crossRef usually never returns an abstract or even an accurate 
  // information, so we use it to enhance semanticscholar search and never return it directly. 
  
  // query CrossRef first to get DOI or enriched metadata 
  const crossRefData = await fetchFromCrossRef(title);

  if (crossRefData?.doi) {
    const semScholarData = await fetchFromSemanticScholarByDOI(crossRefData.doi);
    if (semScholarData && semScholarData.abstract && semScholarData.abstract.trim() !== "") {
      return semScholarData;
    }
  }

  // If no DOI or Semantic Scholar by DOI didn't return a good abstract,
  // fallback to Semantic Scholar search by original title
  const semScholarByTitle = await fetchFromSemanticScholarByTitle(title);
  if (semScholarByTitle && semScholarByTitle.abstract && semScholarByTitle.abstract.trim() !== "") {
    return semScholarByTitle;
  }

  // No data found with abstract, return null 
  return null;
}

