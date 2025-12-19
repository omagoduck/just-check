/**
 * AI-Submittable Search Query Interface
 * This interface extends the standard search query with AI-specific features
 * and gets translated to the standard SearchQuery before execution
 */

import { TimeRange } from './time-range';

export interface SearchQuery {
  /**
   * The search query string
   * This is the main text to search for on the web
   */
  query: string;

  /**
   * Flag to request page content in results
   * When true, the search should include page content (text, images)
   * When false, only basic result information is returned
   */
  requestPageContent: boolean;

  /**
   * Number of search results to return
   * Specifies how many results should be fetched
   */
  limit?: number;

  /**
   * Domains to include in search results
   * Only results from these domains will be returned
   */
  includeDomains?: string[];

  /**
   * Domains to exclude from search results
   * Results from these domains will be filtered out
   */
  excludeDomains?: string[];

  /**
   * Date range for filtering search results
   * Supports explicit dates, predefined time ranges, and AI-provided time ranges
   */
  dateRange?: {
    /**
     * Start date in DD-MM-YYYY format
     */
    start?: string;

    /**
     * End date in DD-MM-YYYY format
     */
    end?: string;

    /**
     * Predefined time range for quick filtering
     * Provides common time periods for easy selection
     */
    timeRange?: TimeRange;
  };

  /**
   * Search mode to use
   * 'auto' = automatic mode selection
   * 'fast' = standard/keyword-based search
   * 'advanced' = neural/advanced search
   */
  mode?: 'auto' | 'fast' | 'advanced';

  /**
   * Country code for region-specific search results
   * Uses ISO 3166-1 alpha-2 country codes (e.g., 'US', 'GB', 'IN')
   */
  country?: string;
}
