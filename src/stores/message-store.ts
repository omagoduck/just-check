import { create } from 'zustand';

// IDEA: Potential renaming
// you see this cannot only be used for starting conversation
// they can also be used to send any message to a conversation from anywhere of the site

interface ConversationStarter {
  message: string;
  modelId?: string;
}

interface ConversationStarterState {
  conversationStarter: ConversationStarter | null;
  setConversationStarter: (conversationStarterData: ConversationStarter) => void;
  clearConversationStarter: () => void;
}

export const useConversationStarterStore = create<ConversationStarterState>((set) => ({
  conversationStarter: null,
  setConversationStarter: (conversationStarterData) => set({ conversationStarter: conversationStarterData }),
  clearConversationStarter: () => set({ conversationStarter: null }),
}));
