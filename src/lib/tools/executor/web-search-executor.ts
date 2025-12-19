/**
 * Server-side executor for the webSearch tool
 */
import type { WebSearchInput, WebSearchOutput } from '../web-search';
import { getSearchProvider, ProviderType } from '../../web-search/providers/Factory';
import { SearchQuery } from '../../web-search/search-query';
import { TimeRange } from '../../web-search/time-range';


/**
 * Helper function to validate and normalize search input
 */
export function normalizeSearchInput(input: any): WebSearchInput {
  return {
    query: typeof input.query === 'string' ? input.query : '',
    requestPageContent: Boolean(input.requestPageContent),
    limit: typeof input.limit === 'number' ? Math.max(1, Math.min(20, input.limit)) : 5,
    includeDomains: Array.isArray(input.includeDomains) ? input.includeDomains : undefined,
    excludeDomains: Array.isArray(input.excludeDomains) ? input.excludeDomains : undefined,
    dateRange: input.dateRange && typeof input.dateRange === 'object' ? {
      start: input.dateRange.start,
      end: input.dateRange.end,
      timeRange: input.dateRange.timeRange,
    } : undefined,
    mode: input.mode && ['auto', 'fast', 'advanced'].includes(input.mode) ? input.mode : 'auto',
    country: input.country && typeof input.country === 'string' ? input.country : undefined,
  };
}

/**
 * Execute the webSearch tool on the server side
 */
export async function executeWebSearch(
  input: WebSearchInput
): Promise<WebSearchOutput> {
  try {
    // Validate input
    if (!input.query || typeof input.query !== 'string' || input.query.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }

    // Validate limit
    const limit = input.limit || 5;
    if (limit < 1 || limit > 20) {
      throw new Error('Limit must be between 1 and 20');
    }

    // Convert SearchQuery input to SearchQuery format
    const searchQuery: SearchQuery = {
      query: input.query.trim(),
      requestPageContent: input.requestPageContent || false,
      limit: limit,
      includeDomains: input.includeDomains,
      excludeDomains: input.excludeDomains,
      dateRange: input.dateRange,
      mode: input.mode || 'auto',
      country: input.country,
    };

    // Determine which provider to use
    // For now, we'll default to Tavily but allow future extension to auto-select based on query type
    let providerType: ProviderType = 'tavily';
    
    // Future logic could be:
    // - Use Exa for research/technical queries
    // - Use Tavily for general queries
    // - Auto-select based on query complexity
    
    // Initialize the provider
    const searchProvider = getSearchProvider(providerType);

    // Execute the search - now returns SearchResult container
    const searchResult = await searchProvider.search(searchQuery);

    // Return simplified output to AI (only essential information)
    return {
      results: searchResult.results, // Extract just the items array
    };
  } catch (error) {
    console.error('Web search error:', error);
    
    // Return fallback data in case of error
    return {
      results: [],
    };
  }
}
