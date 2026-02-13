'use client';

import type { ViewWebsiteInput, ViewWebsiteOutput } from '../view-website';
import { ExternalLink, Globe, Image, Loader2, AlertCircle } from 'lucide-react';
import { UIMessagePart } from '@/lib/conversation-history/types';

interface ViewWebsiteRendererProps {
  part: UIMessagePart;
  isStreaming?: boolean;
}

export function ViewWebsiteRenderer({ part }: ViewWebsiteRendererProps) {
  if (part.type !== 'tool-viewWebsite') {
    return null;
  }

  const callId = part.toolCallId;
  const input = part.input as ViewWebsiteInput;
  const output = part.output as ViewWebsiteOutput;

  // Helper function to format domain name
  const formatDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Helper function to truncate content
  const truncateContent = (content: string, maxLength: number = 500) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  switch (part.state) {
    case 'input-streaming':
      return (
        <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing to view websites...</span>
        </div>
      );

    case 'input-available':
      return (
        <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>
            Viewing {input?.urls?.length || 0} website(s)...
          </span>
        </div>
      );

    case 'output-available':
      const results = output.results || [];
      
      return (
        <div key={callId} className="bg-muted/50 p-4 rounded-lg space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Website Content ({results.length})
              </span>
            </div>
          </div>

          {/* Results */}
          {results.map((result, index) => (
            <div key={index} className="bg-background border border-border rounded-lg p-4 space-y-3">
              {/* Error state */}
              {!result.success && (
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Failed to load</span>
                  </div>
                  {result.error && (
                    <p className="text-sm text-destructive/80 mt-2">{result.error}</p>
                  )}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline mt-2 inline-flex items-center space-x-1"
                  >
                    <span>{result.url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Success state */}
              {result.success && (
                <>
                  {/* URL */}
                  <div className="flex items-center justify-between">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline inline-flex items-center space-x-1"
                    >
                      <span>{formatDomain(result.url)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Title */}
                  {result.title && (
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                      {result.title}
                    </h3>
                  )}

                  {/* Content */}
                  {result.content && (
                    <div className="bg-muted/50 p-2 rounded text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {truncateContent(result.content, 1000)}
                      {result.content.length > 1000 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Content truncated. Visit the original site for the full content.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Images */}
                  {result.images && result.images.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Image className="h-3 w-3" />
                        <span>Images ({result.images.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.images.slice(0, 6).map((imageUrl: string, imgIndex: number) => (
                          <a
                            key={imgIndex}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={imageUrl}
                              alt={`Image ${imgIndex + 1}`}
                              className="h-20 w-20 object-cover rounded border border-border hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </a>
                        ))}
                        {result.images.length > 6 && (
                          <div className="h-20 w-20 bg-muted rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                            +{result.images.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      );

    case 'output-error':
      return (
        <div key={callId} className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to view websites: {part.errorText}</span>
        </div>
      );

    default:
      return null;
  }
}
