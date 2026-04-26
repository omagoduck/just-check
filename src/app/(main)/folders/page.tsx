"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderOpen,
  Plus,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownSurface,
  DropdownTrigger,
} from "@/components/experimental-components/Experimental_DropDown";
import { FolderDialog } from "@/components/folder-dialog";
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from "@/hooks/use-folders";
import type { ConversationFolder } from "@/lib/chat-history";

const FOLDER_COLORS: Record<string, string> = {
  "": "hsl(var(--muted))",
  "#ef4444": "#ef4444",
  "#f97316": "#f97316",
  "#f59e0b": "#f59e0b",
  "#22c55e": "#22c55e",
  "#3b82f6": "#3b82f6",
  "#6366f1": "#6366f1",
  "#a855f7": "#a855f7",
  "#ec4899": "#ec4899",
};

export default function FoldersPage() {
  const router = useRouter();
  const { data, isPending } = useFolders();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<ConversationFolder | null>(null);
  const [folderDialogError, setFolderDialogError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const folders = data?.folders || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Folders</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {folders.length} folder{folders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={() => { setFolderToEdit(null); setFolderDialogError(null); setFolderDialogOpen(true); }}>
              <Plus size={18} />
              New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading folders...</p>
            </div>
          ) : folders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Folder className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No folders yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Create folders to organize your conversations by topic, project, or any way you like.
              </p>
              <Button onClick={() => { setFolderToEdit(null); setFolderDialogError(null); setFolderDialogOpen(true); }}>
                <Plus size={18} />
                Create your first folder
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => router.push(`/folders/${folder.id}`)}
                    onRename={() => {
                      setFolderToEdit(folder);
                      setFolderDialogError(null);
                      setFolderDialogOpen(true);
                    }}
                    onDelete={() => {
                      setFolderToDelete(folder.id);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={(open) => {
          setFolderDialogOpen(open);
          if (!open) { setFolderToEdit(null); setFolderDialogError(null); }
        }}
        folder={folderToEdit}
        isLoading={createFolder.isPending || updateFolder.isPending}
        error={folderDialogError}
        onSubmit={(name, color) => {
          setFolderDialogError(null);
          if (folderToEdit) {
            updateFolder.mutate(
              { folderId: folderToEdit.id, name, color: color || null },
              { onSuccess: () => { setFolderDialogOpen(false); setFolderToEdit(null); }, onError: (err) => setFolderDialogError(err.message) }
            );
          } else {
            createFolder.mutate(
              { name, color },
              { onSuccess: () => setFolderDialogOpen(false), onError: (err) => setFolderDialogError(err.message) }
            );
          }
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
            onClick={() => { setDeleteDialogOpen(false); setFolderToDelete(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border border-border rounded-xl p-6 max-w-sm mx-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Folder?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete the folder and all chats inside it. To keep your chats, move them to another folder or back to your regular chat list before deleting.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setFolderToDelete(null); }}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (folderToDelete) deleteFolder.mutate(folderToDelete);
                    setDeleteDialogOpen(false);
                    setFolderToDelete(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FolderCardProps {
  folder: ConversationFolder;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function FolderCard({ folder, onClick, onRename, onDelete }: FolderCardProps) {
  const color = FOLDER_COLORS[folder.color || ""] || folder.color || "hsl(var(--muted))";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <button
        className="w-full flex flex-col items-center p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/10 hover:shadow-sm transition-all duration-200"
        onClick={onClick}
      >
        <div
          className="w-20 h-20 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: `${color}20` }}
        >
          <FolderOpen size={40} style={{ color }} />
        </div>
        <span className="text-sm font-medium truncate w-full text-center">
          {folder.name}
        </span>
      </button>

      {/* Context menu */}
      <Dropdown align="center">
        <DropdownTrigger asChild>
          <button
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
            onClick={(e) => e.stopPropagation()}
            aria-label="Folder options"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownTrigger>
        <DropdownSurface className="bg-popover border border-border text-popover-foreground min-w-40 shadow-lg">
          <DropdownItem
            icon={<PencilLine size={16} />}
            className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground"
            onSelect={onRename}
          >
            Edit
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
    </motion.div>
  );
}
