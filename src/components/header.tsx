// src/components/header.tsx
"use client";

import Image from "next/image";
import { APP_BRAND_LOGO_URL, APP_BRAND_SHORT_NAME } from "@/lib/branding-constants"; // Ensure these constants are correctly defined and exported
import { Menu as MenuIcon, X } from 'lucide-react';
import Link from "next/link";

// Props for the Header component
interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function Header({ onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) {
  return (
    <header className="flex-shrink-0 bg-background h-header-height text-white px-1 sm:px-2 flex items-center">
      {/* 
        The main div uses flex, justify-between, and items-center.
        On mobile, the menu toggle will be part of the left group.
      */}
      <div className="flex justify-between items-center w-full">
        
        {/* Left Group: Mobile Menu Toggle + Brand */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle Button: Visible only on screens smaller than 'md' */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>

          {/* Brand Logo and Name */}
          <Link href="/" className="flex items-center gap-2 hover:bg-emerald-50/20 bg-transparent px-3 py-1.5 rounded-lg select-none"> {/* Keeps logo and name together */}
            <Image 
              src={APP_BRAND_LOGO_URL} 
              alt={`${APP_BRAND_SHORT_NAME} Logo`} 
              width={32}  // Use desired display width
              height={32} // Use desired display height
              className="h-8 w-8" // This controls the rendered size
              priority // Add priority if it's LCP (Largest Contentful Paint)
            />
            {/* Brand name can be slightly smaller on mobile, or full size based on your preference */}
            <div className="text-xl text-foreground/90 transition-colors cursor-pointer md:text-2xl font-bold">{APP_BRAND_SHORT_NAME}</div>
          </Link>
        </div>
      </div>
    </header>
  );
};
