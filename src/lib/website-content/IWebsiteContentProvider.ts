/**
 * Unified website content provider interface
 * This defines the contract that all website content providers must implement
 */
import { WebsiteContentQuery } from './website-result';
import { WebsiteContentResult } from './website-result';

export interface IWebsiteContentProvider {
  /**
   * Extract content from one or more URLs
   * @param query The website content query parameters
   * @param clerkUserId Optional user ID for allowance deduction
   * @param messageId Optional message ID for logging
   * @returns Promise with extracted content results (one per successful URL)
   */
  extract(
    query: WebsiteContentQuery,
    clerkUserId?: string,
    messageId?: string
  ): Promise<WebsiteContentResult[]>;
}
