'use client';
import ChatInput from '@/components/chat-input';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateConversation } from '@/hooks/use-conversations';
import { useConversationStarterStore } from '@/stores/message-store';
import { useSubscriptionAndAllowanceStatus } from '@/hooks/use-subscription-and-allowance';

export default function Main() {
  const createConversation = useCreateConversation();
  const setConversationStarter = useConversationStarterStore((state) => state.setConversationStarter);
  const [isLoading, setIsLoading] = useState(false);
  const { isFreeUser, hasAllowance, remainingPercentage, periodEnd, isLoading: isLoadingAllowance } = useSubscriptionAndAllowanceStatus();

  const handleSubmit = (message: string, attachments?: Array<{ url: string; originalName: string; mimeType: string }>, UIModelId?: string) => {
    if (!message.trim()) return;

    // Block submission if user has no allowance
    if (!hasAllowance) return;

    setIsLoading(true);

    setConversationStarter({ message: message.trim(), UIModelId, attachments });

    // Use first 256 characters of the message as the conversation title
    const title = message.trim().slice(0, 256);
    createConversation.mutate({ title }, {
      onError: () => {
        setIsLoading(false);
      },
    });
  };

  // Cleanup: reset loading state if component unmounts during mutation
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-8 text-center"
      >
        <div className="text-2xl md:text-3xl h-10 md:h-12 font-bold bg-clip-text text-foreground">
          Need anything? Just ask me.
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-full max-w-3xl"
      >
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Type your message..."
          isFreeUser={isFreeUser}
          hasAllowance={hasAllowance}
          remainingPercentage={remainingPercentage}
          allowanceResetTime={periodEnd}
          isLoadingAllowance={isLoadingAllowance}
        />
      </motion.div>
    </div>
  );
}
