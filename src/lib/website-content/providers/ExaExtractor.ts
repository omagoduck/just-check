/**
 * Exa Website Content Extractor
 * Implements the IWebsiteContentProvider interface using Exa's contents API
 */
import { IWebsiteContentProvider } from '../IWebsiteContentProvider';
import { WebsiteContentQuery, WebsiteContentResult } from '../website-result';

export class ExaExtractor implements IWebsiteContentProvider {
  private apiKey: string;
  private baseUrl = "https://api.exa.ai/contents";

  constructor() {
    this.apiKey = process.env.EXA_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Exa API key is required. Please set EXA_API_KEY environment variable.');
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
      // Build Exa request payload based on the documentation
      const payload: Record<string, any> = {
        urls: [url],
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
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Log raw response for debugging
      console.log('Exa extract raw response:', JSON.stringify(data, null, 2));

      // Parse the Exa response
      return this.parseExaResponse(url, data);
    } catch (error) {
      console.error('Exa extract error:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred during extraction');
    }
  }

  private parseExaResponse(url: string, data: any): WebsiteContentResult {
    const results = data.results || [];
    const extracted = results[0] || {};

    const result: WebsiteContentResult = {
      url,
      title: extracted.title || undefined,
      content: extracted.text || undefined,
      images: [],
    };

    // Collect all image URLs
    const imageUrls: string[] = [];

    // Add main image if available (single string)
    if (extracted.image && typeof extracted.image === 'string' && extracted.image.startsWith('http')) {
      imageUrls.push(extracted.image);
    }

    // Add images from extras
    if (extracted.extras?.imageLinks && Array.isArray(extracted.extras.imageLinks)) {
      const extraImages = extracted.extras.imageLinks
        .map((img: any) => img?.url || img)
        .filter((url: string) => typeof url === 'string' && url.startsWith('http'));
      imageUrls.push(...extraImages);
    }

    // Deduplicate while preserving order (main image first)
    result.images = [...new Set(imageUrls)];

    return result;
  }
}
