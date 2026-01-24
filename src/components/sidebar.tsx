"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTouchDevice } from '@/hooks/use-touch-device';
import { useConversations, useDeleteConversation, useRenameConversation } from '@/hooks/use-conversations';
import {
  SquarePen,
  Sparkles,
  MoreHorizontal,
  PencilLine,
  Trash2,
  HelpCircle,
  Settings,
  User,
  ChevronDown,
  LogOut,
  PanelLeftOpen,
  PanelLeftClose,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dropdown,
  DropdownItem,
  DropdownSurface,
  DropdownTrigger
} from '@/components/experimental-components/Experimental_DropDown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { StoredConversation } from '@/lib/chat-history';

interface ChatSidebarProps {
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isMobileMenuOpen, onMobileMenuToggle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isTouchDevice = useIsTouchDevice();

  // Extract the current conversation ID from the URL
  const activeConversationId = useMemo(() => {
    const match = pathname.match(/^\/chats\/([a-f0-9-]{36})$/i);
    return match ? match[1] : null;
  }, [pathname]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<StoredConversation | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Chat history state - managed by TanStack Query
  const { data, fetchNextPage, hasNextPage, isPending, isFetchingNextPage } = useConversations();
  const deleteConversation = useDeleteConversation();
  const renameConversation = useRenameConversation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flatten infinite query data for display
  const chatHistory = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.conversations);
  }, [data]);

  // Infinite scroll logic using Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isMobileMenuOpen) {
          onMobileMenuToggle();
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, onMobileMenuToggle]);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setAccountMenuOpen(false);
    }
  };

  const NavItem = ({
    icon: Icon,
    label,
    onClick,
    isCollapsed,
    className = "",
    isActive = false
  }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    onClick: () => void;
    isCollapsed: boolean;
    className?: string;
    isActive?: boolean;
  }) => (
    <button
      className={cn(
        "relative flex items-center h-10 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
        "text-sidebar-foreground hover:bg-accent",
        isActive ? "bg-accent" : "",
        className
      )}
      style={{
        width: isCollapsed ? '40px' : '100%',
        paddingLeft: isCollapsed ? '0' : '12px',
        paddingRight: isCollapsed ? '0' : '12px',
        justifyContent: isCollapsed ? 'center' : 'flex-start'
      }}
      onClick={onClick}
      aria-label={isCollapsed ? label : undefined}
    >
      <Icon
        size={20}
        className="shrink-0"
      />
      <span
        className={cn(
          "truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}
        style={{
          marginLeft: isCollapsed ? '0px' : '12px',
          width: isCollapsed ? '0px' : 'auto',
          overflow: 'hidden'
        }}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "flex flex-col h-dvh bg-sidebar border-r border-border shadow-lg z-30",
        // Mobile styles
        "fixed inset-y-0",
        isMobileMenuOpen ? "left-0" : "left-[-272px] md:left-0",
        // Desktop styles
        "md:relative"
      )}
      style={{
        width: isCollapsed ? '64px' : '272px',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Top Section */}
      <div className="flex items-center border-b border-border h-16 shrink-0"
        style={{
          paddingLeft: isCollapsed ? '0' : '16px',
          paddingRight: isCollapsed ? '0' : '16px',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          transition: 'padding 300ms cubic-bezier(0.4, 0, 0.2, 1), justify-content 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <h1
          className={cn(
            "text-xl font-semibold tracking-tight transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)] text-sidebar-foreground",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}
          style={{
            width: isCollapsed ? '0' : 'auto',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          Lumy
        </h1>
        <button
          onClick={toggleCollapse}
          className="text-muted-foreground p-1.5 rounded-md hover:bg-accent hover:text-sidebar-foreground transition-colors duration-200 hidden md:flex items-center justify-center shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="py-3 shrink-0"
        style={{
          paddingLeft: isCollapsed ? '12px' : '16px',
          paddingRight: isCollapsed ? '12px' : '16px',
          transition: 'padding 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <button
          className={cn(
            "relative flex items-center h-10 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "font-medium shadow-sm hover:shadow-md"
          )}
          style={{
            width: isCollapsed ? '40px' : '100%',
            paddingLeft: isCollapsed ? '0' : '12px',
            paddingRight: isCollapsed ? '0' : '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          onClick={() => router.push('/')}
        >
          <SquarePen size={20} className="shrink-0" />
          <span
            className={cn(
              "truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
            style={{
              marginLeft: isCollapsed ? '0px' : '12px',
              width: isCollapsed ? '0px' : 'auto',
              overflow: 'hidden'
            }}
          >
            New Chat
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="grow overflow-y-auto"
        style={{
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >
        <div className="p-4 space-y-6">
          {/* Chat History */}
          <div className="space-y-1">
            <h3
              className={cn(
                "text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)] px-1",
                isCollapsed ? "opacity-0 scale-95 h-0" : "opacity-100 scale-100 h-4"
              )}
              style={{
                maxWidth: isCollapsed ? '0' : '200px'
              }}
            >
              Chat History
            </h3>
            {isPending ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-md" />
                ))}
              </div>
            ) : chatHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm py-2 text-center">No chat history</p>
            ) : (
              <div className="space-y-1">
                {chatHistory.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-200",
                      conversation.id === activeConversationId
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "hover:bg-sidebar-accent"
                    )}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/chats/${conversation.id}`);
                      }
                    }}
                    onClick={() => router.push(`/chats/${conversation.id}`)}
                  >
                    <span className="truncate text-sidebar-foreground transition-colors duration-200">
                      {conversation.title || 'Untitled Conversation'}
                    </span>
                    <Dropdown align="left">
                      <DropdownTrigger asChild>
                        <button
                          className={cn(
                            isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                            'p-1 -mr-1 rounded-md hover:bg-sidebar transition-all duration-200'
                          )}
                          tabIndex={0}
                          aria-label="Chat options"
                        >
                          <MoreHorizontal size={16} className="text-sidebar-foreground" />
                        </button>
                      </DropdownTrigger>
                      <DropdownSurface className="bg-popover border border-border text-popover-foreground min-w-[180px] shadow-lg">
                        <DropdownItem
                          icon={<PencilLine size={16} />}
                          className="flex items-center gap-2 p-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                          onSelect={() => {
                            setConversationToRename(conversation);
                            // Keep input empty if conversation has no title in DB
                            setNewTitle(conversation.title || '');
                            setRenameDialogOpen(true);
                          }}
                        >
                          Rename
                        </DropdownItem>
                        {/* TODO || IDEA: Add share button to share a chat  */}
                        <DropdownItem
                          icon={<Trash2 size={16} />}
                          className="flex items-center gap-2 p-2 text-destructive focus:bg-destructive/10! transition-colors duration-200"
                          onSelect={() => {
                            setConversationToDelete(conversation.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownSurface>
                    </Dropdown>
                  </div>
                ))}

                {/* Sentinel element for infinite scroll */}
                {hasNextPage && (
                  <div ref={loadMoreRef} className="h-0 w-full" />
                )}

                {isFetchingNextPage && (
                  <div className="space-y-2 pt-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded-md" />
                    ))}
                  </div>
                )}
                {!hasNextPage && !isPending && chatHistory.length > 0 && (
                  <p className="text-muted-foreground text-xs text-center pt-2">End of history</p>
                )}
              </div>
            )}
          </div>

          {/* Bespoke Lumy */}
          {/* TODO: This section is disabled for now as it was just for UI testing purposes which came in my mind.
               Will be enabled after actual implementation is completed. */}
          {/* <div className="space-y-1">
            <h3
              className={cn(
                "text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)] px-1",
                isCollapsed ? "opacity-0 scale-95 h-0" : "opacity-100 scale-100 h-4"
              )}
              style={{
                maxWidth: isCollapsed ? '0' : '200px'
              }}
            >
              Bespoke Lumy
            </h3>
            <NavItem
              icon={MessageSquareText}
              label="Translate this"
              onClick={() => { }}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={Image}
              label="Image Generator"
              onClick={() => { }}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={Code}
              label="Code Helper"
              onClick={() => { }}
              isCollapsed={isCollapsed}
            />
          </div> */}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-4 border-t border-border pb-4 shrink-0"
        style={{
          paddingLeft: isCollapsed ? '12px' : '16px',
          paddingRight: isCollapsed ? '12px' : '16px',
          transition: 'padding 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Upgrade Button - Keeping gradient as requested */}
        <button
          className={cn(
            "relative flex items-center h-10 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
            "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
            "text-white font-medium shadow-sm hover:shadow-md"
          )}
          style={{
            width: isCollapsed ? '40px' : '100%',
            paddingLeft: isCollapsed ? '0' : '12px',
            paddingRight: isCollapsed ? '0' : '12px',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          onClick={() => router.push('/upgrade')}
        >
          <Sparkles size={20} className="shrink-0" />
          <span
            className={cn(
              "truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
            style={{
              marginLeft: isCollapsed ? '0px' : '12px',
              width: isCollapsed ? '0px' : 'auto',
              overflow: 'hidden'
            }}
          >
            Upgrade to Pro
          </span>
        </button>

        {/* Account Section */}
        <div className="relative mt-3">
          <Dropdown
            open={accountMenuOpen}
            onOpenChange={setAccountMenuOpen}
            align="center"
            className="w-full"
          >
            <DropdownTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center h-10 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
                  "text-sidebar-foreground hover:bg-accent"
                )}
                style={{
                  width: isCollapsed ? '40px' : '100%',
                  paddingLeft: isCollapsed ? '0' : '12px',
                  paddingRight: isCollapsed ? '0' : '12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
                aria-label={isCollapsed ? "Account menu" : undefined}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="/lumy_gradient_logo.svg" alt="User Avatar" />
                  <AvatarFallback className="bg-secondary">
                    <User className="text-secondary-foreground" size={18} />
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]",
                    isCollapsed ? "opacity-0" : "opacity-100"
                  )}
                  style={{
                    marginLeft: isCollapsed ? '0px' : '12px',
                    width: isCollapsed ? '0px' : 'auto',
                    overflow: 'hidden'
                  }}
                >
                  User Name
                </span>
                {!isCollapsed && (
                  <ChevronDown
                    size={16}
                    className={cn(
                      "ml-auto transition-transform duration-300",
                      accountMenuOpen && "rotate-180"
                    )}
                  />
                )}
              </button>
            </DropdownTrigger>

            <DropdownSurface
              className="bg-popover border border-border text-popover-foreground shadow-lg w-76"
              align="center"
              sideOffset={8}
            >
              <DropdownItem
                icon={<Settings size={24} />}
                className="flex items-center gap-3 px-4 py-3 text-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200 font-medium"
                onSelect={() => router.push('/settings/general')}
              >
                Settings
              </DropdownItem>
              <DropdownItem
                icon={<HelpCircle size={24} />}
                className="flex items-center gap-3 px-4 py-3 text-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200 font-medium"
              >
                Help & Support
              </DropdownItem>
              <div className="h-px bg-border w-full" />
              <DropdownItem
                icon={<LogOut size={24} />}
                className="flex items-center gap-3 px-4 py-3 text-md text-destructive hover:bg-destructive/10! transition-colors duration-200 font-medium"
              >
                Sign out
              </DropdownItem>
            </DropdownSurface>
          </Dropdown>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setConversationToDelete(null);
      }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Chat, Sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this conversation and all its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-3">
            <button
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation.mutate(conversationToDelete);
                }
                setDeleteDialogOpen(false);
                setConversationToDelete(null);
              }}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={(open) => {
        setRenameDialogOpen(open);
        if (!open) {
          setConversationToRename(null);
          setNewTitle('');
        }
      }}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter conversation title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTitle.trim()) {
                if (conversationToRename) {
                  renameConversation.mutate({
                    conversationId: conversationToRename.id,
                    newTitle: newTitle.trim(),
                  });
                }
                setRenameDialogOpen(false);
                setConversationToRename(null);
                setNewTitle('');
              }
            }}
          />
          <DialogFooter className="sm:justify-end gap-3">
            <button
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newTitle.trim()}
              onClick={() => {
                if (conversationToRename && newTitle.trim()) {
                  renameConversation.mutate({
                    conversationId: conversationToRename.id,
                    newTitle: newTitle.trim(),
                  });
                }
                setRenameDialogOpen(false);
                setConversationToRename(null);
                setNewTitle('');
              }}
            >
              Submit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatSidebar;
