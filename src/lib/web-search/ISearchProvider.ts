/**
 * Unified search types and interfaces
 * This defines the contract that all search providers must implement
 */
import { SearchQuery } from './search-query';
import { SearchResult } from './search-result';

export interface ISearchProvider {
  /**
   * Execute a search using the provider's API
   * @param query The search query parameters
   * @param clerkUserId Optional user ID for allowance deduction
   * @returns Promise with search results
   */
  search(
    query: SearchQuery,
    clerkUserId?: string
  ): Promise<SearchResult>;
}
