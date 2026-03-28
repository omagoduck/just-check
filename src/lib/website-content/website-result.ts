/**
 * Website content extraction result types
 * These types define the structure for extracted website content
 */

export interface WebsiteContentResult {
  /**
   * The URL that was extracted
   */
  url: string;

  /**
   * Title of the webpage
   */
  title?: string;

  /**
   * Main content text of the page
   */
  content?: string;

  /**
   * Array of image URLs found on the page
   */
  images?: string[];

  /**
   * URL to the favicon of the website
   */
  favicon?: string;


}

/**
 * Query parameters for website content extraction
 */
export interface WebsiteContentQuery {
  /**
   * The URLs to extract content from
   */
  urls: string[];

  /**
   * Whether to include images in the result
   */
  includeImages?: boolean;

  /**
   * Whether to include raw content (markdown)
   */
  includeRawContent?: boolean;
}
