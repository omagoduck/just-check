"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useArchiveAllConversations, useDeleteAllConversations } from "@/hooks/use-conversations";

export default function DataControlSettingsPage() {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const archiveAll = useArchiveAllConversations();
  const deleteAll = useDeleteAllConversations();

  const handleArchiveAll = () => {
    archiveAll.mutate(undefined, {
      onSuccess: (data) => {
        setArchiveDialogOpen(false);
        if (data.count > 0) {
          toast.success(`${data.count} conversation${data.count !== 1 ? "s" : ""} archived`);
        } else {
          toast.info("No conversations to archive");
        }
      },
      onError: () => {
        setArchiveDialogOpen(false);
        toast.error("Failed to archive conversations");
      },
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: (data) => {
        setDeleteDialogOpen(false);
        if (data.count > 0) {
          toast.success(`${data.count} conversation${data.count !== 1 ? "s" : ""} deleted`);
        } else {
          toast.info("No conversations to delete");
        }
      },
      onError: () => {
        setDeleteDialogOpen(false);
        toast.error("Failed to delete conversations");
      },
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Data Control</h1>

      <div className="space-y-4">
        {/* View Archived Chats */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Archived Chats</p>
              <p className="text-xs text-muted-foreground">View archived conversations</p>
            </div>
          </div>
          <Link href="/archived">
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        </div>

        {/* Archive All Chats */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Archive All Chats</p>
              <p className="text-xs text-muted-foreground">Move all conversations to archive</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setArchiveDialogOpen(true)}>
            Archive All
          </Button>
        </div>

        {/* Delete All Chats */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium text-sm">Delete All Chats</p>
              <p className="text-xs text-muted-foreground">Permanently delete all conversations</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="hover:bg-destructive/80 dark:hover:bg-destructive/75 transition-colors">
            Delete All
          </Button>
        </div>
      </div>

      {/* Archive All Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive All Conversations?</DialogTitle>
            <DialogDescription>
              This will move all your non-archived conversations to the archive. You can unarchive them
              later from the Archived Chats page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)} disabled={archiveAll.isPending}>
              Cancel
            </Button>
            <Button onClick={handleArchiveAll} disabled={archiveAll.isPending}>
              {archiveAll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Archive All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Conversations?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your conversations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteAll.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deleteAll.isPending} className="hover:bg-destructive/80 dark:hover:bg-destructive/75 transition-colors">
              {deleteAll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
