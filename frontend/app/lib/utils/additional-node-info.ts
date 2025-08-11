enum DataSource {
  SemanticScholarByDOI = "semantic-scholar-by-doi",
  SemanticScholarByTitle = "semantic-scholar-by-title",
}

interface WhitePaper {
  title: string;
  author: string;
  abstract: string;
  publisher: string;
  date: string;
  doi?: string;
  dataSource: DataSource;
}

// extract DOI from a link if present
function extractDOIFromLink(link: string): string | null {
  const decodedLink = decodeURIComponent(link);
  const doiMatch = decodedLink.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return doiMatch ? doiMatch[0] : null;
}


// Query via your API route by DOI
async function fetchFromSemanticScholarByDOI(doi: string): Promise<WhitePaper | null> {
  try {
    const res = await fetch(`/api/semantic-scholar?query=DOI:${encodeURIComponent(doi)}`);
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
      doi:paper.externalIds.DOI?paper.externalIds.DOI.toString(): "",
      dataSource: DataSource.SemanticScholarByDOI
    };
  } catch {
    return null;
  }
}

// Query via your API route by title
async function fetchFromSemanticScholarByTitle(title: string): Promise<WhitePaper | null> {
  try {
    const res = await fetch(`/api/semantic-scholar?query=${encodeURIComponent(title)}`);
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
      doi:paper.externalIds.DOI?paper.externalIds.DOI.toString(): "",
      dataSource: DataSource.SemanticScholarByTitle

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

  // fallback to title search
  const semScholarByTitle = await fetchFromSemanticScholarByTitle(linkOrTitle);
  if (semScholarByTitle && semScholarByTitle.abstract.trim()) {
    return semScholarByTitle;
  }

  return null;
}

