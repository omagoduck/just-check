/**
 * Tavily Website Content Extractor
 * Implements the IWebsiteContentProvider interface using Tavily's extract API
 */
import { IWebsiteContentProvider } from '../IWebsiteContentProvider';
import { WebsiteContentQuery, WebsiteContentResult } from '../website-result';

export class TavilyExtractor implements IWebsiteContentProvider {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com/extract";

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Tavily API key is required. Please set TAVILY_API_KEY environment variable.');
    }
  }

  async extract(query: WebsiteContentQuery): Promise<WebsiteContentResult> {
    const { url, includeImages = true, includeRawContent = true } = query;

    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a valid string');
    }

    try {
      // Validate URL format
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    try {
      const payload: Record<string, any> = {
        urls: [url],
        api_key: this.apiKey,
      };

      // Configure what to extract
      if (includeRawContent) {
        payload.include_raw_content = true;
      }
      
      if (includeImages) {
        payload.include_images = true;
        payload.include_image_descriptions = true;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Log raw response for debugging
      console.log('Tavily extract raw response:', JSON.stringify(data, null, 2));

      // Parse the Tavily response
      return this.parseTavilyResponse(url, data);
    } catch (error) {
      console.error('Tavily extract error:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred during extraction');
    }
  }

  private parseTavilyResponse(url: string, data: any): WebsiteContentResult {
    // Tavily returns results as an array with one item per URL
    const results = data.results || [];
    const extracted = results[0] || {};

    const result: WebsiteContentResult = {
      url,
      title: extracted.title || undefined,
      content: extracted.content || extracted.raw_content || undefined,
      images: [],
    };

    // Process images if available
    if (extracted.images && Array.isArray(extracted.images)) {
      result.images = extracted.images
        .map((img: any) => img.url || img)
        .filter((url: string) => typeof url === 'string' && url.startsWith('http'));
    }

    return result;
  }
}
