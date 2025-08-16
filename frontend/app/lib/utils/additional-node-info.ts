import { parseStringPromise } from "xml2js";

export enum DataSource {
  SemanticScholarByDOI = "semantic-scholar-by-doi",
  SemanticScholarByTitle = "semantic-scholar-by-title",
  ArxivById = "arxiv-by-id",
}

export interface WhitePaper {
  title: string;
  author: string;
  abstract: string;
  publisher: string;
  date: string;
  doi?: string;
  dataSource: DataSource;
}

export async function fetchFromArxivById(link: string): Promise<WhitePaper | null> {
  try {

    // link is something like: https://arxiv.org/abs/1712.09913
    const queryList = link.split("/");

    // unique identifier is the last numerical part 1712.09913
    // sometimes is versioned, for ex:1712.09913v1; we ignore anything after the v
    let queryId = queryList[queryList.length - 1].split("v")[0];   

    const apiUrl = `https://export.arxiv.org/api/query?search_query=id:${queryId}`;
    const res = await fetch(apiUrl);
    const xml = await res.text();

    const parsed = await parseStringPromise(xml, { explicitArray: false });

    const entry = parsed.feed.entry;
    if (!entry) return null;

    const title = entry.title.trim();
    const author = Array.isArray(entry.author)
      ? entry.author.map((a: any) => a.name).join(", ")
      : entry.author.name;
    const summary = entry.summary.trim();
    const published = entry.published;
    const doi = entry["arxiv:doi"];

    return {
      title,
      author,
      abstract: summary,
      publisher: "arXiv",
      date: published,
      doi,
      dataSource: DataSource.ArxivById,
    };
  } catch (err) {
    console.error("Failed to fetch from arXiv:", err);
    return null;
  }
}

export async function getPaperData(link: string): Promise<WhitePaper> {
  const res = await fetch(`/api/arxiv?link=${encodeURIComponent(link)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  return res.json();
}

