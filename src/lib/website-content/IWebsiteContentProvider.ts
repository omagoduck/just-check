/**
 * Unified website content provider interface
 * This defines the contract that all website content providers must implement
 */
import { WebsiteContentQuery } from './website-result';
import { WebsiteContentResult } from './website-result';

export interface IWebsiteContentProvider {
  /**
   * Extract content from a given URL
   * @param query The website content query parameters
   * @param clerkUserId Optional user ID for allowance deduction
   * @returns Promise with extracted content result
   */
  extract(
    query: WebsiteContentQuery,
    clerkUserId?: string
  ): Promise<WebsiteContentResult>;
}
