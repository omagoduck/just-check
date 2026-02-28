/**
 * Tavily Search Provider Implementation
 * Translates unified SearchQuery to Tavily API format and back to unified SearchResult
 */
import { ISearchProvider } from '../ISearchProvider';
import { SearchQuery } from '../search-query';
import { SearchResult, SearchResultItem } from '../search-result';
import { convertTimeRangeToStartDate, TimeRange } from '../time-range';
import { getFaviconUrlFromGoogle } from '../favicon-utils';
import { chargeAndLogToolAllowance } from '@/lib/allowance/tool-charging';

export class TavilyProvider implements ISearchProvider {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com/search";

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Tavily API key is required. Please set TAVILY_API_KEY environment variable.');
    }
  }

  async search(
    query: SearchQuery,
    clerkUserId?: string
  ): Promise<SearchResult> {
    try {
      // 1. Translation: Unified SearchQuery -> Tavily Request
      const tavilyPayload = this.buildTavilyPayload(query);

      // 2. Execute the API call
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tavilyPayload),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 3. Charge allowance and log usage (only on success)
      if (clerkUserId) {
        const costCents = this.calculateCost(query);

        await chargeAndLogToolAllowance({
          toolName: 'webSearch',
          args: query,
          result: data,
          costCents,
          clerkUserId,
          metadata: {
            mode: query.mode,
            limit: query.limit,
            provider: 'tavily',
            searchDepth: query.mode === 'advanced' ? 'advanced' : 'basic'
          },
        });
      }

      // 4. Translation: Tavily Response -> Unified SearchResult container
      return this.translateTavilyResults(data, query);
    } catch (error) {
      console.error('Tavily search error:', error);
      throw new Error(`Tavily search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildTavilyPayload(query: SearchQuery): any {
    const payload: any = {
      query: query.query,
      max_results: query.limit || 5,
      api_key: this.apiKey,
    };

    // Map search mode
    if (query.mode === 'advanced') {
      payload.search_depth = 'advanced';
    } else {
      payload.search_depth = 'basic';
    }

    // Map domains
    if (query.includeDomains && query.includeDomains.length > 0) {
      payload.include_domains = query.includeDomains;
    }

    if (query.excludeDomains && query.excludeDomains.length > 0) {
      payload.exclude_domains = query.excludeDomains;
    }

    // Map date range
    if (query.dateRange) {
      if (query.dateRange.start) {
        // Convert DD-MM-YYYY to YYYY-MM-DD for Tavily
        payload.start_date = this.convertDateFormat(query.dateRange.start);
      }
      
      if (query.dateRange.end) {
        // Convert DD-MM-YYYY to YYYY-MM-DD for Tavily
        payload.end_date = this.convertDateFormat(query.dateRange.end);
      } else if (query.dateRange.timeRange) {
        // Use time range enum
        payload.start_date = convertTimeRangeToStartDate(query.dateRange.timeRange);
        // End date is automatically set to today by Tavily
      }
    }

    // Map content requirements
    if (query.requestPageContent) {
      payload.include_raw_content = 'markdown';
      payload.include_images = true;
      payload.include_image_descriptions = true;
    } else {
      payload.include_raw_content = false;
      payload.include_images = false;
    }

    // Additional Tavily-specific options
    payload.include_answer = false; // Usually false for raw search results
    payload.include_favicon = true;
    payload.auto_parameters = false;
    payload.topic = 'general';

    return payload;
  }

  private translateTavilyResults(data: any, query: SearchQuery): SearchResult {
    if (!data.results || !Array.isArray(data.results)) {
      return {
        query: query.query,
        results: [],
        provider: 'tavily',
        metadata: { error: 'No results found' }
      };
    }

    const results: SearchResultItem[] = data.results.map((item: any) => {
      const searchResult: SearchResultItem = {
        url: item.url || '',
        title: item.title || '',
        snippet: item.content || '',
        sourceName: this.extractDomainFromUrl(item.url || ''),
        relevanceScore: item.score,
        publishedDate: item.published_date,
      };

      // Add page content if available
      if (item.raw_content && item.raw_content.trim()) {
        searchResult.pageContent = {
          text: item.raw_content,
        };
      }

      // Add images if available
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        searchResult.pageContent = {
          ...searchResult.pageContent,
          images: item.images,
        };
      }

      // Add favicon if available from API, otherwise use standard fallback
      if (item.favicon) {
        searchResult.favicon = item.favicon;
      } else if (item.url) {
        // Use standard favicon URL according to web standards
        searchResult.favicon = getFaviconUrlFromGoogle(item.url);
      }

      return searchResult;
    });

    return {
      query: query.query,
      results: results,
      provider: 'tavily',
      metadata: {
        totalResults: data.results.length,
        searchMode: query.mode || 'auto',
        rawResponse: data // Keep raw response for debugging if needed
      }
    };
  }

  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }

  private convertDateFormat(dateStr: string): string {
    // Convert DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return dateStr; // Return as-is if format doesn't match
  }

  /**
   * Calculate cost in cents for this search query
   * Tavily: basic = 1 credit ($0.008), advanced = 2 credits ($0.016)
   * We round to nearest cent: 0.8 → 1, 1.6 → 2
   */
  private calculateCost(query: SearchQuery): number {
    return query.mode === 'advanced' ? 2 : 1;
  }
}
