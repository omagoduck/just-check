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
   * @param messageId Optional message ID for logging
   * @returns Promise with extracted content result
   */
  extract(
    query: WebsiteContentQuery,
    clerkUserId?: string,
    messageId?: string
  ): Promise<WebsiteContentResult>;
}
