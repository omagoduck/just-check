/**
 * Simplified favicon utility
 * Uses Google's S2 favicon CDN for reliable favicon retrieval
 */

/**
 * Gets a favicon URL for a given website URL
 * Uses Google's S2 favicon CDN service which reliably returns favicons
 * @param url The website URL
 * @param size The favicon size in pixels (default: 32)
 * @returns Favicon URL, or undefined if URL is invalid
 */
export function getFaviconUrlFromGoogle(url: string, size: number = 32): string | undefined {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return undefined;
  }
}
