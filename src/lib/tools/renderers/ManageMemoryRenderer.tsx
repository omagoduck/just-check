'use client';

import type { UIMessage } from 'ai';
import { Brain } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import CodeBlockContainer from '@/components/CodeBlockContainer';

interface ManageMemoryRendererProps {
  part: UIMessage['parts'][number];
  isStreaming?: boolean;
}

function statusLabel(state: 'pending' | 'success' | 'error'): string {
  switch (state) {
    case 'pending':
      return 'Managing memory...';
    case 'success':
      return 'Managed memory';
    case 'error':
      return 'Could not manage memory';
  }
}

export function ManageMemoryRenderer({ part }: ManageMemoryRendererProps) {
  if (part.type !== 'tool-manageMemory') {
    return null;
  }

  const callId = part.toolCallId;
  const input = part.input;
  const output = part.output;

  switch (part.state) {
    case 'input-streaming':
      return (
        <div key={callId} className="flex items-start space-x-2 text-muted-foreground">
          <Brain className="h-4 w-4 animate-pulse shrink-0 mt-0.5" />
          <span className="text-sm">{statusLabel('pending')}</span>
        </div>
      );

    case 'input-available':
      return (
        <div key={callId} className="flex items-start space-x-2 text-muted-foreground">
          <Brain className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-sm">{statusLabel('pending')}</span>
        </div>
      );

    case 'output-available':
      return (
        <Accordion key={callId} type="single" collapsible>
          <AccordionItem value="manage-memory" className="border-none">
            <AccordionTrigger className="py-0 hover:no-underline hover:bg-transparent transition-colors duration-200 group w-fit flex-none">
              <div className="flex items-start space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Brain className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-sm">{statusLabel('success')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              <div className="ml-1.5 border-l-2 border-border pl-4 space-y-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Input</div>
                  <CodeBlockContainer
                    code={JSON.stringify(input ?? {}, null, 2)}
                    language="json"
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Output</div>
                  <CodeBlockContainer
                    code={JSON.stringify(output ?? {}, null, 2)}
                    language="json"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case 'output-error':
      return (
        <Accordion key={callId} type="single" collapsible>
          <AccordionItem value="manage-memory-error" className="border-none">
            <AccordionTrigger className="py-0 hover:no-underline hover:bg-transparent transition-colors duration-200 group w-fit flex-none">
              <div className="flex items-start space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <Brain className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-sm">{statusLabel('error')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0">
              <div className="ml-1.5 border-l-2 border-border pl-4 space-y-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Input</div>
                  <CodeBlockContainer
                    code={JSON.stringify(input ?? {}, null, 2)}
                    language="json"
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Error</div>
                  <CodeBlockContainer
                    code={part.errorText || 'Unknown error'}
                    language="text"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    default:
      return null;
  }
}
