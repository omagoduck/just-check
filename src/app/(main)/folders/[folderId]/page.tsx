"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  ArrowLeft,
  Loader2,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Trash2,
  Pin,
  PinOff,
  Archive,
  FolderInput,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dropdown,
  DropdownItem,
  DropdownSurface,
  DropdownTrigger,
} from "@/components/experimental-components/Experimental_DropDown";
import { FolderDialog } from "@/components/folder-dialog";
import { useFolder, useFolders, useUpdateFolder, useMoveToFolder, useDeleteFolder } from "@/hooks/use-folders";
import { useConversationsInFolder, usePinConversation, useArchiveConversation, useDeleteConversation, useRenameConversation } from "@/hooks/use-conversations";
import type { StoredConversation, ConversationFolder } from "@/lib/chat-history";

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const { data: folderData, isLoading: folderLoading } = useFolder(folderId);
  const { data: conversationsData, isLoading: conversationsLoading } = useConversationsInFolder(folderId);
  const { data: foldersData } = useFolders();
  const updateFolder = useUpdateFolder();
  const moveToFolder = useMoveToFolder();
  const deleteFolder = useDeleteFolder();
  const pinConversation = usePinConversation();
  const archiveConversation = useArchiveConversation();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useRenameConversation();

  const [searchQuery, setSearchQuery] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<StoredConversation | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [conversationToMove, setConversationToMove] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const folder = folderData?.folder;
  const folders = foldersData?.folders || [];
  const otherFolders = folders.filter((f) => f.id !== folderId);

  const conversations = useMemo(() => {
    if (!conversationsData) return [];
    return conversationsData.pages.flatMap((page) => page.conversations);
  }, [conversationsData]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      (c.title || "Untitled Conversation").toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const isLoading = folderLoading || conversationsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading folder...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Folder className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Folder not found</h2>
        <p className="text-muted-foreground mb-6">This folder may have been deleted.</p>
        <Button variant="outline" onClick={() => router.push("/folders")}>
          Back to folders
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/folders")}
              className="shrink-0"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${folder.color || "hsl(var(--muted))"}20` }}
              >
                <Folder size={20} style={{ color: folder.color || undefined }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold truncate">{folder.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFolderDialogOpen(true)}>
              <PencilLine size={16} className="mr-1.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
              <p className="text-muted-foreground max-w-md">
                Move conversations into this folder to see them here.
              </p>
            </motion.div>
          ) : (
            <>
              {conversations.length > 1 && (
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <FolderConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    folders={otherFolders}
                    onOpen={() => router.push(`/chats/${conversation.id}`)}
                    onRename={() => {
                      setConversationToRename(conversation);
                      setNewTitle(conversation.title || "");
                      setRenameDialogOpen(true);
                    }}
                    onPin={() => pinConversation.mutate({ conversationId: conversation.id, pinned: !conversation.pinned_at })}
                    onArchive={() => archiveConversation.mutate({ conversationId: conversation.id, archived: true })}
                    onRemoveFromFolder={() => moveToFolder.mutate({ conversationId: conversation.id, folderId: null })}
                    onDelete={() => {
                      setConversationToDelete(conversation.id);
                      setDeleteDialogOpen(true);
                    }}
                    onMoveToFolder={() => {
                      setConversationToMove(conversation.id);
                      setMoveDialogOpen(true);
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

      {/* Rename Dialog */}
      <FolderConversationRenameDialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) { setConversationToRename(null); setNewTitle(""); }
        }}
        title={newTitle}
        onTitleChange={setNewTitle}
        onSubmit={() => {
          if (conversationToRename && newTitle.trim()) {
            renameConversation.mutate({
              conversationId: conversationToRename.id,
              newTitle: newTitle.trim(),
            });
          }
          setRenameDialogOpen(false);
          setConversationToRename(null);
          setNewTitle("");
        }}
      />

      {/* Move to Folder Dialog */}
      <FolderConversationMoveDialog
        open={moveDialogOpen}
        onOpenChange={(open) => {
          setMoveDialogOpen(open);
          if (!open) setConversationToMove(null);
        }}
        folders={folders}
        onSelectFolder={(targetFolderId) => {
          if (conversationToMove) {
            moveToFolder.mutate({ conversationId: conversationToMove, folderId: targetFolderId });
          }
          setMoveDialogOpen(false);
          setConversationToMove(null);
        }}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => { setDeleteDialogOpen(false); setConversationToDelete(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-xl p-6 max-w-sm mx-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Chat?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete this conversation and all its messages.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setConversationToDelete(null); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (conversationToDelete) deleteConversation.mutate(conversationToDelete);
                    setDeleteDialogOpen(false);
                    setConversationToDelete(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folder={folder}
        isLoading={updateFolder.isPending}
        onSubmit={(name, color) => {
          updateFolder.mutate(
            { folderId: folder.id, name, color: color || null },
            { onSuccess: () => setFolderDialogOpen(false) }
          );
        }}
      />
    </div>
  );
}

// ============================================================================
// CONVERSATION CARD
// ============================================================================

interface FolderConversationCardProps {
  conversation: StoredConversation;
  folders: ConversationFolder[];
  onOpen: () => void;
  onRename: () => void;
  onPin: () => void;
  onArchive: () => void;
  onRemoveFromFolder: () => void;
  onDelete: () => void;
  onMoveToFolder: () => void;
}

function FolderConversationCard({
  conversation,
  folders,
  onOpen,
  onRename,
  onPin,
  onArchive,
  onRemoveFromFolder,
  onDelete,
  onMoveToFolder,
}: FolderConversationCardProps) {
  const isPinned = !!conversation.pinned_at;

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
        {isPinned ? (
          <Pin size={18} className="text-muted-foreground" />
        ) : (
          <MessageSquare size={18} className="text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <button className="flex-1 text-left min-w-0" onClick={onOpen}>
        <h3 className="font-medium text-sm truncate">
          {conversation.title || "Untitled Conversation"}
        </h3>
      </button>

      {/* Three-dot menu */}
      <Dropdown align="right">
        <DropdownTrigger asChild>
          <button
            className="shrink-0 p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
            onClick={(e) => e.stopPropagation()}
            aria-label="Chat options"
          >
            <MoreHorizontal size={18} />
          </button>
        </DropdownTrigger>
        <DropdownSurface className="bg-popover border border-border text-popover-foreground min-w-[180px] shadow-lg">
          <DropdownItem
            icon={<PencilLine size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onRename}
          >
            Rename
          </DropdownItem>
          <DropdownItem
            icon={isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onPin}
          >
            {isPinned ? "Unpin" : "Pin"}
          </DropdownItem>
          <DropdownItem
            icon={<Archive size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onArchive}
          >
            Archive
          </DropdownItem>
          <DropdownItem
            icon={<FolderInput size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onMoveToFolder}
          >
            Move to folder
          </DropdownItem>
          <DropdownItem
            icon={<Folder size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onRemoveFromFolder}
          >
            Remove from folder
          </DropdownItem>
          <DropdownItem
            icon={<Trash2 size={16} />}
            className="flex items-center gap-2 p-2 text-destructive focus:bg-destructive/10!"
            onSelect={onDelete}
          >
            Delete
          </DropdownItem>
        </DropdownSurface>
      </Dropdown>
    </div>
  );
}

// ============================================================================
// RENAME DIALOG
// ============================================================================

interface FolderConversationRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
}

function FolderConversationRenameDialog({
  open,
  onOpenChange,
  title,
  onTitleChange,
  onSubmit,
}: FolderConversationRenameDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Rename Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter a new name for this conversation.</p>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter conversation title"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) onSubmit(); }}
            />
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={!title.trim()} onClick={onSubmit}>Submit</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MOVE TO FOLDER DIALOG
// ============================================================================

interface FolderConversationMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ConversationFolder[];
  onSelectFolder: (folderId: string | null) => void;
}

function FolderConversationMoveDialog({
  open,
  onOpenChange,
  folders,
  onSelectFolder,
}: FolderConversationMoveDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Move to Folder</h3>
            <p className="text-sm text-muted-foreground mb-4">Select a folder to move this conversation to.</p>
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No other folders.</p>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm"
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <Folder size={16} style={{ color: folder.color || undefined }} />
                    <span>{folder.name}</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
