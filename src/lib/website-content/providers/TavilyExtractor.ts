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
  ): Promise<WebsiteContentResult[]> {
    const { urls, includeImages = true, includeRawContent = true } = query;

    if (!urls || urls.length === 0) {
      throw new Error('At least one URL is required');
    }

    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL format: ${url}`);
      }
    }

    try {
      const payload: Record<string, any> = {
        urls,
        api_key: this.apiKey,
        depth: mode,
      };

      if (includeRawContent) {
        payload.include_raw_content = true;
      }

      if (includeImages) {
        payload.include_images = true;
        payload.include_image_descriptions = true;
      }

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

      const results = this.parseTavilyResponse(data);

      // Charge per successful extraction
      // Tavily pricing: $0.008/credit
      //   basic = 1 credit per 5 successful extractions = 0.16¢ per extraction
      //   advanced = 2 credits per 5 successful extractions = 0.32¢ per extraction
      if (clerkUserId && results.length > 0) {
        const costPerExtraction = mode === 'advanced' ? 0.32 : 0.16;
        const cost = results.length * costPerExtraction;

        await chargeAndLogToolAllowance({
          toolName: 'viewWebsite',
          args: query,
          result: data,
          cost,
          clerkUserId,
          messageId,
          metadata: {
            urlCount: results.length,
            provider: 'tavily',
            providerMode: 'extract',
            extractMode: mode,
          },
        });
      }

      return results;
    } catch (error) {
      console.error('Tavily extract error:', error);
      throw new Error('Failed to extract website content. Please try again later.');
    }
  }

  private parseTavilyResponse(data: any): WebsiteContentResult[] {
    const results = data.results || [];

    return results.map((item: any) => {
      const result: WebsiteContentResult = {
        url: item.url || '',
        title: item.title || undefined,
        content: item.content || item.raw_content || undefined,
        images: [],
      };

      if (item.images && Array.isArray(item.images)) {
        result.images = item.images
          .map((img: any) => img.url || img)
          .filter((url: string) => typeof url === 'string' && url.startsWith('http'));
      }

      if (item.favicon) {
        result.favicon = item.favicon;
      }

      return result;
    });
  }
}
