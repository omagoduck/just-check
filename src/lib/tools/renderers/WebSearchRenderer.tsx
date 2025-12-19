'use client';

import type { UIMessage } from 'ai';
import type { WebSearchInput, WebSearchOutput } from '../web-search';
import { Search, ExternalLink, Clock, Globe, Star } from 'lucide-react';

interface WebSearchRendererProps {
  part: UIMessage['parts'][number];
  isStreaming?: boolean;
}

export function WebSearchRenderer({ part }: WebSearchRendererProps) {
  if (part.type !== 'tool-webSearch') {
    return null;
  }

  const callId = part.toolCallId;
  const input = part.input as WebSearchInput;
  const output = part.output as WebSearchOutput;

  // Helper function to format domain name
  const formatDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  switch (part.state) {
    case 'input-streaming':
      return (
        <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
          <Search className="h-4 w-4 animate-pulse" />
          <span>Processing search request...</span>
        </div>
      );

    case 'input-available':
      return (
        <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>
            Searching for "{input?.query || 'search query'}"...
          </span>
        </div>
      );

    case 'output-available':
      return (
        <div key={callId} className="bg-muted/50 p-4 rounded-lg space-y-4">
          {/* Search Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Web Search</span>
            </div>
          </div>

          {/* Search Results */}
          {output.results.length > 0 ? (
            <div className="space-y-3">
              {output.results.map((result, index) => (
                <div key={index} className="bg-background border border-border rounded-lg p-3 space-y-2">
                  {/* Result Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        {result.favicon ? (
                          <img
                            src={result.favicon}
                            alt=""
                            className="h-4 w-4 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {result.sourceName || formatDomain(result.url)}
                        </span>
                        {result.publishedDate && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(result.publishedDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Title and Link */}
                      <div className="flex items-start gap-2">
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline line-clamp-2 leading-tight"
                        >
                          {result.title}
                        </a>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                    
                    {/* Relevance Score */}
                    {result.relevanceScore && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(result.relevanceScore * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Snippet */}
                  {result.snippet && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {result.snippet}
                    </p>
                  )}

                  {/* Page Content Preview */}
                  {result.pageContent?.text && (
                    <div className="bg-muted/50 p-2 rounded text-xs">
                      <div className="text-muted-foreground mb-1">Content preview:</div>
                      <p className="text-foreground line-clamp-2 leading-relaxed">
                        {result.pageContent.text.substring(0, 200)}...
                      </p>
                    </div>
                  )}

                  {/* Images */}
                  {result.pageContent?.images && result.pageContent.images.length > 0 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {result.pageContent.images.slice(0, 3).map((imageUrl, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={imageUrl}
                          alt=""
                          className="h-16 w-16 object-cover rounded border border-border flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                      {result.pageContent.images.length > 3 && (
                        <div className="h-16 w-16 bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                          +{result.pageContent.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found</p>
              <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      );

    case 'output-error':
      return (
        <div key={callId} className="flex items-center space-x-2 text-destructive">
          <Search className="h-4 w-4" />
          <span>Search failed: {part.errorText}</span>
        </div>
      );

    default:
      return null;
  }
}
