// TODO: We will modify this page more later.
'use client';
import ChatInput from '@/components/chat-input';
import { motion } from 'framer-motion';

export default function Main() {

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
          onStopGenerating={stop}
          placeholder="Type your message..."
        />
      </motion.div>
    </div>
  );
}
