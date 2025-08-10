interface WhitePaper {
  title: string;
  author: string;
  abstract: string;
  publisher: string;
  date: string;
  doi?: string; // optional field
}

// extract DOI from a link if present
function extractDOIFromLink(link: string): string | null {
  const doiMatch = link.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return doiMatch ? doiMatch[0] : null;
}

// Query via your API route by DOI
async function fetchFromSemanticScholarByDOI(doi: string): Promise<WhitePaper | null> {
  try {
    const res = await fetch(`/api/semantic?query=DOI:${encodeURIComponent(doi)}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    // Handle the response structure from your API route
    if (!data.data || data.data.length === 0) return null;
    const paper = data.data[0];
    
    return {
      title: paper.title || "",
      author: paper.authors?.map((a: any) => a.name).join(", ") || "",
      abstract: paper.abstract || "",
      publisher: paper.venue || "",
      date: paper.year ? paper.year.toString() : "",
      doi
    };
  } catch {
    return null;
  }
}

// Query via your API route by title
async function fetchFromSemanticScholarByTitle(title: string): Promise<WhitePaper | null> {
  try {
    const res = await fetch(`/api/semantic?query=${encodeURIComponent(title)}`);
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
      doi: paper.doi || undefined
    };
  } catch {
    return null;
  }
}

export async function getPaperData(linkOrTitle: string): Promise<WhitePaper | null> {
  // Since DOI presence will guarantee an exact match if ss has it, first: 
  const doi = extractDOIFromLink(linkOrTitle);
  if (doi) {
    const semScholarData = await fetchFromSemanticScholarByDOI(doi);
    if (semScholarData && semScholarData.abstract.trim()) {
      return semScholarData;
    }
  }
  
  // else fallback to a title search
  const semScholarByTitle = await fetchFromSemanticScholarByTitle(linkOrTitle);
  if (semScholarByTitle && semScholarByTitle.abstract.trim()) {
    return semScholarByTitle;
  }
  
  return null;
}

