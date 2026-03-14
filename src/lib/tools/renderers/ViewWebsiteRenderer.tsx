'use client';

import type { ViewWebsiteInput, ViewWebsiteOutput } from '../view-website';
import { ExternalLink, Globe, Loader2, AlertCircle } from 'lucide-react';
import { UIMessagePart } from '@/lib/conversation-history/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
        <div key={callId} className="flex items-start space-x-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
          <span className="text-sm">Preparing to view websites...</span>
        </div>
      );

    case 'input-available':
      return (
        <div key={callId} className="flex items-start space-x-2 text-muted-foreground">
          <Globe className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">Viewing {input?.urls?.length || 0} website(s)...</span>
        </div>
      );

    case 'output-available':
      const results = output.results || [];
      
      return (
        <Accordion key={callId} type="single" collapsible>
          <AccordionItem value="view-website" className="border-none">
            <AccordionTrigger className="py-0 hover:no-underline hover:bg-transparent transition-colors duration-200 group w-fit flex-none">
              <div className="flex items-start space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-sm">Viewed {results.length} website{results.length !== 1 ? 's' : ''}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              <div className="ml-1.5 border-l-2 border-border pl-4">
                {results.length > 0 ? (
                  <div className="bg-muted/50 border border-border rounded-md">
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
                              src={result.favicon || getFaviconUrlFromGoogle(result.url) || ''}
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
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No websites found. Try adjusting your URLs.
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case 'output-error':
      return (
        <div key={callId} className="flex items-start space-x-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">Failed to view websites</span>
        </div>
      );

    default:
      return null;
  }
}
