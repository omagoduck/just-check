import { IWebsiteContentProvider } from '../IWebsiteContentProvider';
import { TavilyExtractor } from './TavilyExtractor';
import { ExaExtractor } from './ExaExtractor';

/**
 * Provider type for website content extraction
 */
export type WebsiteContentProviderType = 'tavily' | 'exa' | 'custom';

/**
 * Factory function to get a website content provider
 * @param type - The type of provider to use (default: 'tavily')
 * @returns A provider instance implementing IWebsiteContentProvider
 */
export function getWebsiteContentProvider(type: WebsiteContentProviderType = 'exa'): IWebsiteContentProvider {
  switch (type) {
    case 'tavily':
      return new TavilyExtractor();
    case 'exa':
      return new ExaExtractor();
    case 'custom':
      // Future: Custom scraper implementation
      throw new Error('Custom provider not yet implemented. Use "tavily" or "exa" for now.');
    default:
      throw new Error(`Unknown website content provider: ${type}`);
  }
}
