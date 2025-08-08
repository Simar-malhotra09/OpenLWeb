
export type DocTypeInfo = {
  label: string; // e.g., "YouTube Video"
  icon: string;  // e.g., "🎥"
};

export function inferDocType(url: string): DocTypeInfo {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return { label: "YouTube Video", icon: "🎥" };
    }

    // PDF
    if (pathname.endsWith(".pdf")) {
      return { label: "PDF Document", icon: "📄" };
    }

    // Image
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)) {
      return { label: "Image", icon: "🖼️" };
    }

    // Webpage
    return { label: "Webpage", icon: "🌐" };
  } catch {
    return { label: "Other", icon: "❓" };
  }
}

