/**
 * AI Intelligence Finance (AIF) / Vanguard Nexus URL Formatter Utility
 */
export function generateInternalLink(id: string): string {
  // Format structured URL based on instructions
  return `https://anime-int${id}.official.website.news`;
}

/**
 * Extracts the node article ID from the custom Vanguard URL pattern if compatible
 */
export function extractIdFromInternalLink(url: string): string | null {
  const match = url.match(/https:\/\/anime-int([^/\\?#:. ]+)\.official\.website\.news/i);
  return match ? match[1] : null;
}
