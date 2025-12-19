/**
 * Exa Search Provider Implementation
 * Translates unified SearchQuery to Exa API format and back to unified SearchResult
 */
import { ISearchProvider } from '../ISearchProvider';
import { SearchQuery } from '../search-query';
import { SearchResult, SearchResultItem } from '../search-result';
import { convertTimeRangeToStartDate, TimeRange } from '../time-range';
import { getFaviconUrl } from '../favicon-utils';

export class ExaProvider implements ISearchProvider {
  private apiKey: string;
  private baseUrl = "https://api.exa.ai/search";

  constructor() {
    this.apiKey = process.env.EXA_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Exa API key is required. Set EXA_API_KEY environment variable.');
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      // 1. Translation: Unified SearchQuery -> Exa Request
      const exaPayload = this.buildExaPayload(query);

      // 2. Execute the API call
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(exaPayload),
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 3. Translation: Exa Response -> Unified SearchResult container
      return this.translateExaResults(data, query);
    } catch (error) {
      console.error('Exa search error:', error);
      throw new Error(`Exa search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildExaPayload(query: SearchQuery): any {
    const payload: any = {
      query: query.query,
      num_results: query.limit || 5,
      use_autoprompt: true, // Generally recommended for Exa
    };

    // Map search mode
    if (query.mode === 'advanced') {
      payload.type = 'neural';
    } else {
      payload.type = 'keyword';
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
        // Exa expects YYYY-MM-DD format
        payload.start_published_date = this.convertDateFormat(query.dateRange.start);
      }
      
      if (query.dateRange.end) {
        // Exa expects YYYY-MM-DD format
        payload.end_published_date = this.convertDateFormat(query.dateRange.end);
      } else if (query.dateRange.timeRange) {
        // Use time range enum
        const startDate = convertTimeRangeToStartDate(query.dateRange.timeRange);
        payload.start_published_date = this.convertDateFormat(startDate);
        // End date is automatically set to today by Exa
      }
    }

    // Exa requires a 'contents' object to return text
    if (query.requestPageContent) {
      payload.contents = {
        text: {
          max_characters: 5000, // Adjust limit as needed
          include_html_tags: false
        }
      };
    } else {
      // If we just want snippets, use smaller text amount
      payload.contents = {
        text: {
          max_characters: 300, // Snippet size
          include_html_tags: false
        }
      };
    }

    // Add highlights for better snippets
    payload.highlights = {
      query: `summarize ${query.query}`,
      num_sentences: 2,
      highlights_per_url: 1
    };

    return payload;
  }

  private translateExaResults(data: any, query: SearchQuery): SearchResult {
    if (!data.results || !Array.isArray(data.results)) {
      return {
        query: query.query,
        results: [],
        provider: 'exa',
        metadata: { error: 'No results found' }
      };
    }

    const results: SearchResultItem[] = data.results.map((item: any) => {
      const searchResult: SearchResultItem = {
        url: item.url || '',
        title: item.title || this.extractDomainFromUrl(item.url || ''),
        snippet: item.text || item.highlights?.[0]?.text || '',
        sourceName: this.extractDomainFromUrl(item.url || ''),
        relevanceScore: item.score,
        publishedDate: item.published_date,
      };

      // Add favicon if available from API, otherwise use standard fallback
      if (item.favicon) {
        searchResult.favicon = item.favicon;
      } else if (item.url) {
        // Use standard favicon URL according to web standards
        searchResult.favicon = getFaviconUrl(item.url);
      }

      // Add page content if available and requested
      if (item.text && item.text.trim()) {
        searchResult.pageContent = {
          text: item.text,
        };
      }

      // Add highlights as additional content
      if (item.highlights && Array.isArray(item.highlights) && item.highlights.length > 0) {
        searchResult.snippet = item.highlights[0].text || searchResult.snippet;
        
        // Add highlights to metadata for reference
        searchResult.metadata = {
          ...searchResult.metadata,
          highlights: item.highlights.map((h: any) => ({
            text: h.text,
            positions: h.positions,
          })),
        };
      }

      return searchResult;
    });

    return {
      query: query.query,
      results: results,
      provider: 'exa',
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
}
