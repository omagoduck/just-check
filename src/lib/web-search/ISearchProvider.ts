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
   * @returns Promise with search results
   */
  search(query: SearchQuery): Promise<SearchResult>;
}
