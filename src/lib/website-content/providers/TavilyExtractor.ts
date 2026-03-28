/**
 * Tavily Website Content Extractor
 * Implements the IWebsiteContentProvider interface using Tavily's extract API
 */
import { IWebsiteContentProvider } from '../IWebsiteContentProvider';
import { WebsiteContentQuery, WebsiteContentResult } from '../website-result';
import { chargeAndLogToolAllowance } from '@/lib/allowance/tool-charging';

export class TavilyExtractor implements IWebsiteContentProvider {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com/extract";

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Tavily API key is required. Please set TAVILY_API_KEY environment variable.');
    }
  }

  async extract(
    query: WebsiteContentQuery,
    clerkUserId?: string,
    messageId?: string,
    mode: 'basic' | 'advanced' = 'basic'
  ): Promise<WebsiteContentResult> {
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
        depth: mode,
      };

      // Configure what to extract
      if (includeRawContent) {
        payload.include_raw_content = true;
      }

      if (includeImages) {
        payload.include_images = true;
        payload.include_image_descriptions = true;
      }

      // Always request favicon
      payload.include_favicon = true;

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


      const result = this.parseTavilyResponse(url, data);

      // Charge allowance and log usage (only on success)
      // Tavily pricing: $0.008/credit
      //   basic = 1 credit per 5 successful extractions = 0.16¢ per extraction
      //   advanced = 2 credits per 5 successful extractions = 0.32¢ per extraction
      if (clerkUserId) {
        const cost = mode === 'advanced' ? 0.32 : 0.16;

        await chargeAndLogToolAllowance({
          toolName: 'viewWebsite',
          args: query,
          result: data,
          cost,
          clerkUserId,
          messageId,
          metadata: {
            urlCount: 1,
            provider: 'tavily',
            providerMode: 'extract',
            extractMode: mode,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Tavily extract error:', error);
      throw new Error('Failed to extract website content. Please try again later.');
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

    // Extract favicon if available
    if (extracted.favicon) {
      result.favicon = extracted.favicon;
    }

    return result;
  }
}
