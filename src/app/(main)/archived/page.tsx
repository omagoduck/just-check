"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Inbox,
  ArrowLeft,
  MessageSquare,
  Clock,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useArchivedConversations, useArchiveConversation } from "@/hooks/use-conversations";
import { useIsTouchDevice } from "@/hooks/use-touch-device";
import type { StoredConversation } from "@/lib/chat-history";

export default function ArchivedPage() {
  const router = useRouter();
  const { data, isPending } = useArchivedConversations();
  const archiveConversation = useArchiveConversation();
  const [searchQuery, setSearchQuery] = useState("");
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null);

  const archivedConversations = useMemo(() => {
    if (!data) return [];
    return data.pages
      .flatMap((page) => page.conversations)
      .filter((c) => c.archived_at);
  }, [data]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return archivedConversations;
    const query = searchQuery.toLowerCase();
    return archivedConversations.filter((c) =>
      (c.title || "Untitled Conversation").toLowerCase().includes(query)
    );
  }, [archivedConversations, searchQuery]);

  const handleUnarchive = (conversationId: string) => {
    setUnarchivingId(conversationId);
    archiveConversation.mutate(
      { conversationId, archived: false },
      {
        onSettled: () => setUnarchivingId(null),
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Archive size={20} className="text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Archived</h1>
                <p className="text-sm text-muted-foreground">
                  {archivedConversations.length} archived conversation{archivedConversations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading archived conversations...</p>
            </div>
          ) : archivedConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No archived conversations</h2>
              <p className="text-muted-foreground max-w-md">
                When you archive a conversation, it will appear here. Archived conversations are hidden from your main chat list.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/")}
              >
                Go to chats
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Search */}
              {archivedConversations.length > 1 && (
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search archived conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Conversation List */}
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <ArchivedConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isUnarchiving={unarchivingId === conversation.id}
                    onUnarchive={() => handleUnarchive(conversation.id)}
                    onOpen={() => {
                      router.push(`/chats/${conversation.id}`);
                    }}
                  />
                ))}
              </div>

              {filteredConversations.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No conversations match &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ArchivedConversationCardProps {
  conversation: StoredConversation;
  isUnarchiving: boolean;
  onUnarchive: () => void;
  onOpen: () => void;
}

function ArchivedConversationCard({
  conversation,
  isUnarchiving,
  onUnarchive,
  onOpen,
}: ArchivedConversationCardProps) {
  const isTouchDevice = useIsTouchDevice();

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl border border-border",
        "bg-card hover:bg-accent/50 transition-all duration-200",
        "hover:shadow-sm hover:border-accent-foreground/10"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <MessageSquare size={18} className="text-muted-foreground" />
      </div>

      {/* Content */}
      <button
        className="flex-1 text-left min-w-0"
        onClick={onOpen}
      >
        <h3 className="font-medium text-sm truncate">
          {conversation.title || "Untitled Conversation"}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>Archived {formatRelativeTime(conversation.archived_at!)}</span>
        </div>
      </button>

      {/* Unarchive Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUnarchive}
        disabled={isUnarchiving}
        className={cn(
          "shrink-0",
          !isTouchDevice && "hidden group-hover:inline-flex"
        )}
        title="Unarchive"
      >
        {isUnarchiving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArchiveRestore className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Unarchive</span>
      </Button>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
