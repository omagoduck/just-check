'use client';

/**
 * BranchIndicator Component
 *
 * Displays a branch switcher control (‹ x / y ›) for messages that have siblings.
 * Allows users to navigate between different branches of the conversation.
 *
 * TODO | P5: Branch switching during streaming causes sync conflicts between
 * viewing branch and streaming branch during 'automatically send'.
 * The spec demands this feature but it requires deeper investigation into
 * useChat's status transitions during client-side tool calls.
 * Disabled (opacity + pointer-events) during loading for now to unblock other work.
 * We have most of the basics done to support this but needs improvement
 * to avoid sync conflict.
 */

import { memo, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface BranchIndicatorProps {
  currentIndex: number;
  totalSiblings: number;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
  className?: string;
}

export const BranchIndicator = memo(function BranchIndicator({
  currentIndex,
  totalSiblings,
  onPrevious,
  onNext,
  isLoading = false,
  className,
}: BranchIndicatorProps) {
  const handlePrevious = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoading) onPrevious();
    },
    [onPrevious, isLoading]
  );

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoading) onNext();
    },
    [onNext, isLoading]
  );

  // Don't render if there's only one sibling
  if (totalSiblings <= 1) {
    return null;
  }

  // Format the display: "‹ x / y ›"
  const displayText = `${currentIndex + 1} / ${totalSiblings}`;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-muted-foreground',
        isLoading && 'opacity-50 pointer-events-none',
        className
      )}
      role="navigation"
      aria-label="Branch navigation"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isLoading}
            className={cn(
              'p-2 rounded-md transition-colors duration-200',
              'hover:bg-muted/80 text-foreground/70 hover:text-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Previous branch"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Previous branch</p>
        </TooltipContent>
      </Tooltip>

      <span className="px-1 text-sm tabular-nums" aria-live="polite">
        {displayText}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleNext}
            disabled={currentIndex === totalSiblings - 1 || isLoading}
            className={cn(
              'p-2 rounded-md transition-colors duration-200',
              'hover:bg-muted/80 text-foreground/70 hover:text-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Next branch"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Next branch</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});
