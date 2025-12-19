/**
 * Internal search result container that works across different providers
 * This interface provides a consistent structure for search results regardless
 * of the underlying search provider being used.
 * 
 * This contains the raw search results along with metadata about the search operation.
 */
export interface SearchResult {
  /**
   * The original search query that generated these results
   */
  query: string;

  /**
   * Array of individual search result items
   */
  results: SearchResultItem[];

  /**
   * The search provider used (e.g., 'tavily', 'exa')
   */
  provider: string;

  /**
   * Provider-specific metadata about the search operation
   */
  metadata?: Record<string, any>;
}

/**
 * Individual search result item
 * This represents a single search result from the provider
 */
export interface SearchResultItem {
  /**
   * URL of the search result
   */
  url: string;

  /**
   * Title of the search result
   */
  title: string;

  /**
   * Brief snippet/description of the content
   */
  snippet: string;

  /**
   * Name of the source website
   */
  sourceName: string;

  /**
   * Date when the content was published (optional)
   */
  publishedDate?: Date | string;

  /**
   * Page content structure with images and text
   */
  pageContent?: {
    /**
     * Array of image URLs found in the page
     */
    images?: string[];

    /**
     * Main text content of the page
     */
    text?: string;
  };

  /**
   * URL to the favicon of the source website
   */
  favicon?: string;

  /**
   * Relevance score of the search result
   * Typically a value between 0 and 1 indicating how relevant the result is to the query
   */
  relevanceScore?: number;

  /**
   * Additional metadata about the search result
   * This can include provider-specific information
   */
  metadata?: Record<string, any>;
}
