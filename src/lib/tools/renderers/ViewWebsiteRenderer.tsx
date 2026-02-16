'use client';

import type { ViewWebsiteInput, ViewWebsiteOutput } from '../view-website';
import { ExternalLink, Globe, Loader2, AlertCircle } from 'lucide-react';
import { UIMessagePart } from '@/lib/conversation-history/types';
import { Separator } from '@/components/ui/separator';
import { getFaviconUrlFromGoogle } from '@/lib/web-search/favicon-utils';

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
        <div key={callId} className="bg-muted/50 p-4 rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Viewed {results.length} website{results.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Results - Unified Container with Separators */}
          <div className="bg-background border border-border rounded-md overflow-hidden">
            {results.map((result, index) => (
              <div key={index}>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Favicon */}
                    <img
                      src={getFaviconUrlFromGoogle(result.url) || ''}
                      alt=""
                      className="h-4 w-4 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0 hidden" />
                    
                    {/* Site Title or Domain */}
                    <span className="text-sm truncate hover:underline text-foreground">
                      {result.title || formatDomain(result.url)}
                    </span>
                  </div>
                  
                  {/* Redirect Icon */}
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </a>
                {/* Separator between items (not after last item) */}
                {index < results.length - 1 && <Separator />}
              </div>
            ))}
          </div>
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
