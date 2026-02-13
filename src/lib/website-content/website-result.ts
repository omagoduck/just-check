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
   * Whether the extraction was successful
   */
  success: boolean;

  /**
   * Error message if extraction failed
   */
  error?: string;
}

/**
 * Query parameters for website content extraction
 */
export interface WebsiteContentQuery {
  /**
   * The URL to extract content from
   */
  url: string;

  /**
   * Whether to include images in the result
   */
  includeImages?: boolean;

  /**
   * Whether to include raw content (markdown)
   */
  includeRawContent?: boolean;
}
