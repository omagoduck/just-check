/**
 * Server-side executor for the viewWebsite tool
 */
import type { ViewWebsiteInput, ViewWebsiteOutput } from '../view-website';
import { getWebsiteContentProvider } from '../../website-content';

/**
 * Execute the viewWebsite tool on the server side
 * Uses the website content provider to extract content from URLs
 */
export async function executeViewWebsite(
  input: ViewWebsiteInput
): Promise<ViewWebsiteOutput> {
  try {
    // Validate input
    if (!input.urls || !Array.isArray(input.urls) || input.urls.length === 0) {
      throw new Error('URLs array is required and must contain at least one URL');
    }

    // Validate each URL
    for (const url of input.urls) {
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL format: ${url}`);
      }
    }

    // Get the website content provider (can be overridden via WEBSITE_CONTENT_PROVIDER env var)
    const providerType = 'exa';
    const provider = getWebsiteContentProvider(providerType);

    // Extract content from all URLs
    const results = await Promise.all(
      input.urls.map(async (url) => {
        const result = await provider.extract({
          url,
          includeImages: true,
          includeRawContent: true,
        });

        return {
          url: result.url,
          title: result.title,
          content: result.content,
          images: result.images,
        };
      })
    );

    return { results };
  } catch (error) {
    console.error('View website error:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}
