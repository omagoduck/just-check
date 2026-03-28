/**
 * Exa Website Content Extractor
 * Implements the IWebsiteContentProvider interface using Exa's contents API
 */
import { IWebsiteContentProvider } from '../IWebsiteContentProvider';
import { WebsiteContentQuery, WebsiteContentResult } from '../website-result';
import { chargeAndLogToolAllowance } from '@/lib/allowance/tool-charging';

export class ExaExtractor implements IWebsiteContentProvider {
  private apiKey: string;
  private baseUrl = "https://api.exa.ai/contents";

  constructor() {
    this.apiKey = process.env.EXA_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Exa API key is required. Please set EXA_API_KEY environment variable.');
    }
  }

  async extract(
    query: WebsiteContentQuery,
    clerkUserId?: string,
    messageId?: string
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
        text: includeRawContent,
        extras: {
          links: 5,
          imageLinks: includeImages ? 10 : 0,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }

      const data = await response.json();

      const results = this.parseExaResponse(data);

      // Charge per page per content type
      // Exa Contents pricing: $1/1k pages per content type
      //   Text = 1 content type = $0.001 = 0.1¢ per page
      //   (Highlights and Summary not requested by this extractor)
      if (clerkUserId && results.length > 0) {
        const costPerPage = includeRawContent ? 0.1 : 0;

        if (costPerPage > 0) {
          const cost = results.length * costPerPage;

          await chargeAndLogToolAllowance({
            toolName: 'viewWebsite',
            args: query,
            result: data,
            cost,
            clerkUserId,
            messageId,
            metadata: {
              urlCount: results.length,
              provider: 'exa',
              contentTypes: includeRawContent ? ['text'] : [],
            },
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Exa extract error:', error);
      throw new Error('Failed to extract website content. Please try again later.');
    }
  }

  private parseExaResponse(data: any): WebsiteContentResult[] {
    const results = data.results || [];

    return results.map((item: any) => {
      const result: WebsiteContentResult = {
        url: item.url || '',
        title: item.title || undefined,
        content: item.text || undefined,
        images: [],
        favicon: item.favicon || undefined,
      };

      // Collect all image URLs
      const imageUrls: string[] = [];

      if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
        imageUrls.push(item.image);
      }

      if (item.extras?.imageLinks && Array.isArray(item.extras.imageLinks)) {
        const extraImages = item.extras.imageLinks
          .map((img: any) => img?.url || img)
          .filter((url: string) => typeof url === 'string' && url.startsWith('http'));
        imageUrls.push(...extraImages);
      }

      result.images = [...new Set(imageUrls)];

      return result;
    });
  }
}
