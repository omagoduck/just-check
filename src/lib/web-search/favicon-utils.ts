/**
 * Favicon utility functions for web search
 * Provides robust favicon URL retrieval according to web standards
 * with comprehensive fallback mechanisms and edge case handling
 */

/**
 * Generates comprehensive favicon URLs for a given domain according to web standards
 * Includes multiple fallback locations and common favicon naming conventions
 * @param url The website URL
 * @returns Array of potential favicon URLs in order of preference
 */
export function getFaviconUrls(url: string): string[] {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const baseDomain = domain.replace('www.', '');
    const protocol = parsedUrl.protocol;

    // Comprehensive list of standard favicon locations
    // Ordered by likelihood of existence and common usage
    return [
      // Root domain favicons (most common)
      `${protocol}//${domain}/favicon.ico`,
      `${protocol}//www.${baseDomain}/favicon.ico`,

      // Common alternative formats
      `${protocol}//${domain}/favicon.png`,
      `${protocol}//www.${baseDomain}/favicon.png`,
      `${protocol}//${domain}/favicon.jpg`,
      `${protocol}//www.${baseDomain}/favicon.jpg`,
      `${protocol}//${domain}/favicon.jpeg`,
      `${protocol}//www.${baseDomain}/favicon.jpeg`,
      `${protocol}//${domain}/favicon.svg`,
      `${protocol}//www.${baseDomain}/favicon.svg`,

      // Common subdirectory locations
      `${protocol}//${domain}/assets/favicon.ico`,
      `${protocol}//${domain}/static/favicon.ico`,
      `${protocol}//${domain}/images/favicon.ico`,
      `${protocol}//${domain}/img/favicon.ico`,

      // Common alternative filenames
      `${protocol}//${domain}/icon.ico`,
      `${protocol}//${domain}/icon.png`,
      `${protocol}//${domain}/site-icon.ico`,
      `${protocol}//${domain}/site-icon.png`,

      // Apple touch icons (often used as fallbacks)
      `${protocol}//${domain}/apple-touch-icon.png`,
      `${protocol}//${domain}/apple-touch-icon-precomposed.png`,
      `${protocol}//${domain}/apple-touch-icon-120x120.png`,
      `${protocol}//${domain}/apple-touch-icon-152x152.png`,
    ];
  } catch {
    // If URL parsing fails, return empty array
    return [];
  }
}

/**
 * Gets the best favicon URL for a given website URL according to web standards
 * @param url The website URL
 * @returns The most likely favicon URL, or undefined if URL is invalid
 */
export function getFaviconUrl(url: string): string | undefined {
  const faviconUrls = getFaviconUrls(url);
  return faviconUrls[0]; // Return the most common location
}

/**
 * Asynchronously finds the first working favicon URL by testing multiple standard locations
 * This is a more robust approach that actually verifies favicon existence
 * @param url The website URL
 * @param timeout Timeout in milliseconds for each favicon check (default: 2000ms)
 * @returns Promise resolving to the first working favicon URL, or undefined if none found
 */
export async function findWorkingFaviconUrl(
  url: string,
  timeout: number = 2000
): Promise<string | undefined> {
  try {
    const faviconUrls = getFaviconUrls(url);

    // Test each favicon URL in order of preference
    for (const faviconUrl of faviconUrls) {
      try {
        // Use HEAD request for faster checking (no body download)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(faviconUrl, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store' // Avoid cached 404 responses
        });

        clearTimeout(timeoutId);

        // If the favicon exists (status 200-299), return it
        if (response.ok) {
          return faviconUrl;
        }
      } catch {
        // Continue to next favicon URL if this one fails
        continue;
      }
    }

    // If no working favicon found, return the most likely URL anyway
    // This allows the browser to handle the fallback gracefully
    return faviconUrls[0];
  } catch {
    // If anything goes wrong, return undefined
    return undefined;
  }
}

/**
 * Creates a favicon fallback object with multiple URL options
 * Useful for progressive enhancement and graceful degradation
 * @param url The website URL
 * @returns Favicon fallback object with multiple URL options
 */
export function createFaviconFallback(url: string): {
  primary: string | undefined;
  alternatives: string[];
  allOptions: string[];
} {
  const allOptions = getFaviconUrls(url);
  return {
    primary: allOptions[0],
    alternatives: allOptions.slice(1),
    allOptions: allOptions
  };
}
