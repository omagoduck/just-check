'use client';
import ChatInput from '@/components/chat-input';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateConversation } from '@/hooks/use-conversations';
import { useConversationStarterStore } from '@/stores/message-store';

export default function Main() {
  const createConversation = useCreateConversation();
  const setConversationStarter = useConversationStarterStore((state) => state.setConversationStarter);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (message: string, attachments?: File[], modelId?: string) => {
    if (!message.trim()) return;

    setIsLoading(true);

    setConversationStarter({ message: message.trim(), modelId });

    createConversation.mutate(undefined, {
      onSuccess: () => {
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      },
    });
  };

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
        layoutId="chat-input-container"
        className="w-full max-w-3xl"
      >
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Type your message..."
        />
      </motion.div>
    </div>
  );
}
