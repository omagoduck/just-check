"use client";

import { cn } from '@/lib/utils';
import { useState } from 'react';
import ChatSidebar from "@/components/sidebar";
import Header from '@/components/header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar Wrapper: Handles mobile fixed positioning and desktop sticky */}
      <div
        className={cn(
          // Common: Height, base transition
          "h-screen transition-transform duration-300 ease-in-out z-30",
          // Mobile: fixed, full translation for open/close. Set fixed width here.
          "fixed inset-y-0 left-0 w-72", // << Width for mobile sidebar (e.g., 18rem)
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: relative, no translation, width becomes auto for DemoSidebar to control.
          "md:relative md:translate-x-0 md:w-auto"
        )}
      >

        {/* <ChatSidebar /> */}

        <ChatSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={toggleMobileMenu}
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Interface */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
        <Header
          onMobileMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
