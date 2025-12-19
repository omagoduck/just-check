import { z } from 'zod';
import { SearchQuery } from '../web-search/search-query';
import { SearchResultItem } from '../web-search/search-result';
import { TimeRange } from '../web-search/time-range';
import { executeWebSearch } from './executor/web-search-executor';

// Type definitions for web search tool
export interface WebSearchInput extends SearchQuery {}

// Simplified output for AI - only essential information
export interface WebSearchOutput {
  results: SearchResultItem[];
}

// Web search tool definition with AI SDK format
export const webSearchTool = {
  description: 'Search the web for information using AI-powered search providers. Supports both fast keyword search and advanced neural search modes.',
  inputSchema: z.object({
    query: z.string().describe('The search query string'),
    requestPageContent: z.boolean().optional().default(false).describe('Flag to request page content in results. When true, includes full page text and images.'),
    limit: z.number().optional().default(5).describe('Number of search results to return (1-20)'),
    includeDomains: z.array(z.string()).optional().describe('Domains to include in search results (e.g., ["arxiv.org", "nature.com"])'),
    excludeDomains: z.array(z.string()).optional().describe('Domains to exclude in search results'),
    dateRange: z.object({
      start: z.string().optional().describe('Start date in DD-MM-YYYY format'),
      end: z.string().optional().describe('End date in DD-MM-YYYY format'),
      timeRange: z.enum(Object.values(TimeRange)).optional().describe('Preset time range for quick filtering')
    }).optional().describe('Date range for filtering search results'),
    mode: z.enum(['auto', 'fast', 'advanced']).optional().default('auto').describe('Search mode: fast (keyword-based) or advanced (neural, goes beyond keywords to understand intent)'),
    country: z.string().optional().describe('Country code for region-specific search results (e.g., "US", "GB")'),
  }) as z.ZodType<WebSearchInput>,
  execute: executeWebSearch,
};
