import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessagesForConversation, StoredMessage } from '@/lib/chat-history';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

/**
 * Organizes messages into a linear sequence based on previous_message_id pointers.
 * 
 * @param messages Unordered array of stored messages
 * @returns Ordered array of stored messages
 */
function orderMessages(messages: StoredMessage[]): StoredMessage[] {
    if (messages.length === 0) return [];

    const orderedMessages: StoredMessage[] = [];

    // Create a map to find the child of any message quickly
    // Key: previous_message_id, Value: The message that points to it
    const childMap = new Map<string | null, StoredMessage>();
    for (const msg of messages) {
        if (msg.previous_message_id === null) {
            childMap.set(null, msg);
        } else {
            childMap.set(msg.previous_message_id, msg);
        }
    }

    // Follow the chain starting from the root (null)
    let nextMessage = childMap.get(null);
    const seenIds = new Set<string>();

    while (nextMessage && !seenIds.has(nextMessage.id)) {
        orderedMessages.push(nextMessage);
        seenIds.add(nextMessage.id);
        nextMessage = childMap.get(nextMessage.id);
    }

    return orderedMessages;
}

/**
 * GET /api/conversations/[conversationId]/messages
 * 
 * Retrieves all messages for a specific conversation, ordered by sequence.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await params;

        // 1. Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(conversationId)) {
            return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
        }

        // 2. Verify ownership/existence first
        const supabase = getSupabaseAdminClient();
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .eq('clerk_user_id', clerkUserId)
            .is('deleted_at', null)
            .single();

        if (convError || !conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // 2. Fetch raw messages
        const rawMessages = await getMessagesForConversation(conversationId);

        // 3. Order messages
        const messages = orderMessages(rawMessages);

        // 4. Map StoredMessage to format suitable for useChat's initialMessages
        const uiMessages = messages.map(msg => ({
            id: msg.id,
            role: msg.sender_type,
            parts: msg.content,
            metadata: msg.metadata,
            createdAt: msg.created_at ? new Date(msg.created_at) : undefined,
        }));

        return NextResponse.json({ messages: uiMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
