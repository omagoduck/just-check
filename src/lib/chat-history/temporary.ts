import { getSupabaseAdminClient } from '@/lib/supabase-client';

export async function ensureConversationNotTemporary(
  conversationId: string,
  clerkUserId: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, is_temporary')
    .eq('id', conversationId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .single();

  if (error || !conversation) {
    throw new Error('Conversation not found');
  }

  if (conversation.is_temporary) {
    throw new Error('Conversation not found');
  }
}

export async function endTemporaryConversation(conversationId: string, clerkUserId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: conversation, error: findError } = await supabase
    .from('conversations')
    .select('id, is_temporary')
    .eq('id', conversationId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .maybeSingle();

  if (findError) {
    throw new Error(`Failed to load conversation: ${findError.message}`);
  }

  if (!conversation) {
    return;
  }

  if (!conversation.is_temporary) {
    throw new Error('Conversation is not temporary');
  }

  const { error: deleteError } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('clerk_user_id', clerkUserId)
    .eq('is_temporary', true);

  if (deleteError) {
    throw new Error(`Failed to end temporary conversation: ${deleteError.message}`);
  }
}
