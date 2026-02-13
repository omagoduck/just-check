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
   * @returns Promise with extracted content result
   */
  extract(query: WebsiteContentQuery): Promise<WebsiteContentResult>;
}
