import YoutubeIcon from '../icons/youtube.png';
import PdfIcon from '../icons/pdf.png';
import WebpageIcon from '../icons/webpage.png';
import UnkownIcon from '../icons/unknown.png';

import React from "react";

export type DocTypeInfo = {
  label: string;
  icon: React.ReactNode; 
  type?: string;
};


const researchHosts = [
  "nature.com",
  "arxiv.org",
  "pubmed.ncbi.nlm.nih.gov",
  "sciencedirect.com",
  "semanticscholar.org",
  "springer.com",
  "jstor.org",
  "wiley.com",
  "tandfonline.com",
  "mdpi",
  ".edu",
  "ieee",
  "doc",
];

export function inferDocType(url: string): DocTypeInfo {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    // YouTube video
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return {
        label: "YouTube Video",
        icon: <img src="/icons/youtube.png" alt="YouTube" className="inline h-5 w-5" />,
        type: "video",
      };
    }

    // Check if hostname matches research paper hosts
    const isResearchHost = researchHosts.some(host => hostname.includes(host));

    // PDF document
    if (pathname.endsWith(".pdf")) {
      return {
        label: "PDF Document",
        icon: <img src="/icons/pdf.png" alt="PDF" className="inline h-5 w-5" />,
        // if research host, mark as whitepaper type else pdf
        type: isResearchHost ? "whitepaper" : "pdf",
      };
    }

    // Webpage (default)
    return {
      label: "Webpage",
      icon: <img src="/icons/webpage.png" alt="Webpage" className="inline h-5 w-5" />,
      type: isResearchHost ? "whitepaper" : "webpage",
    };
  } catch {
    return {
      label: "Other",
      icon: <img src="/icons/unknown.png" alt="Other" className="inline h-5 w-5" />,
      type: "other",
    };
  }
}

