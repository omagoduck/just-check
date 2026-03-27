'use client';

import { memo } from "react";
import { UIMessage } from 'ai';
import { UserMessage } from './UserMessage';
import { AIMessage } from './AIMessage';

interface MessageRendererProps {
  message: UIMessage;
  isStreaming?: boolean;
  isLoading?: boolean;
  isGenerating?: boolean;
  onEdit?: (text: string) => void;
  branchCurrentIndex?: number;
  branchTotalSiblings?: number;
  onBranchPrevious?: () => void;
  onBranchNext?: () => void;
}

export const MessageRenderer = memo(function MessageRenderer({
  message,
  isStreaming = false,
  isLoading = false,
  isGenerating = false,
  onEdit,
  branchCurrentIndex,
  branchTotalSiblings,
  onBranchPrevious,
  onBranchNext,
}: MessageRendererProps) {

  switch (message.role) {
    case 'user':
      return (
        <UserMessage
          message={message}
          onEdit={onEdit}
          branchCurrentIndex={branchCurrentIndex}
          branchTotalSiblings={branchTotalSiblings}
          onBranchPrevious={onBranchPrevious}
          onBranchNext={onBranchNext}
          isGenerating={isGenerating}
          isLoading={isLoading}
        />
      );
    case 'assistant':
      return <AIMessage message={message} isStreaming={isStreaming} />;
    default:
      return null;
  }
});