import { z } from 'zod';
import { executeViewWebsite } from './executor/view-website-executor';

/**
 * Type definitions for viewWebsite tool
 * This tool extracts content from given URLs
 */

export interface ViewWebsiteInput {
  /**
   * The URLs of the websites to view (array supported by Tavily and Exa)
   */
  urls: string[];
}

/**
 * Output from the viewWebsite tool
 */
export interface ViewWebsiteOutput {
  /**
   * Array of results, one per URL
   */
  results: Array<{
    /**
     * The URL that was extracted
     */
    url: string;
    /**
     * Title of the webpage
     */
    title?: string;
    /**
     * Main content text of the page
     */
    content?: string;
    /**
     * Array of image URLs found on the page
     */
    images?: string[];
    /**
     * Whether the extraction was successful
     */
    success: boolean;
    /**
     * Error message if extraction failed
     */
    error?: string;
  }>;
}

/**
 * viewWebsite tool definition with AI SDK format
 * This tool allows the AI to view the content of specific website URLs
 */
export const viewWebsiteTool = {
  description: 'View and extract content from specific website URLs. Use this when you need to get the full content of particular webpages, articles, or documentation. Returns the page title, content, images, and metadata for each URL.',
  inputSchema: z.object({
    urls: z.array(z.string().url()).describe('Array of URLs to view (e.g., ["https://example.com/article1", "https://example.com/article2"])'),
  }) as z.ZodType<ViewWebsiteInput>,
  execute: executeViewWebsite,
};
