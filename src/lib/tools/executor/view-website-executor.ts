/**
 * Server-side executor for the viewWebsite tool
 */
import type { ViewWebsiteInput, ViewWebsiteOutput } from '../view-website';
import { getWebsiteContentProvider } from '../../website-content';

/**
 * Execute the viewWebsite tool on the server side
 * Uses the website content provider to extract content from URLs in a single batch request
 */
export async function executeViewWebsite(
  input: ViewWebsiteInput,
  clerkUserId?: string,
  messageId?: string
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

    // Get the website content provider
    const providerType = 'exa';
    const provider = getWebsiteContentProvider(providerType);

    // Extract content from all URLs in a single batch request
    const results = await provider.extract(
      {
        urls: input.urls,
        includeImages: true,
        includeRawContent: true,
      },
      clerkUserId,
      messageId
    );

    return { results };
  } catch (error) {
    console.error('View website error:', error);
    throw new Error('Failed to view website. Please try again later.');
  }
}
