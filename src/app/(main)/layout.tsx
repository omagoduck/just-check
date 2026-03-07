"use client";

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import ChatSidebar from "@/components/sidebar";
import Header from '@/components/header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-dvh bg-background">

      {/* Sidebar Wrapper: Handles mobile fixed positioning and desktop sticky */}
      <div
        className={cn(
          // Common: Height, base transition
          "h-dvh transition-transform duration-300 ease-in-out z-30",
          // Mobile: fixed, full translation for open/close. Set fixed width here.
          "fixed inset-y-0 left-0 w-72", // << Width for mobile sidebar (e.g., 18rem)
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: relative, no translation, width becomes auto for DemoSidebar to control.
          "md:relative md:translate-x-0 md:w-auto"
        )}
      >

        {/* <ChatSidebar /> */}

        <ChatSidebar
          isMobileSidebarOpen={isMobileSidebarOpen}
          onMobileSidebarToggle={toggleMobileSidebar}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Interface */}
      <div className="grow flex flex-col h-dvh overflow-hidden relative">
        <Header
          onMobileSidebarToggle={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        <div className="grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
