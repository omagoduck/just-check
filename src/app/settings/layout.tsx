"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Shield,
  Plug,
  User,
  Brain,
  ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { APP_BRAND_SHORT_NAME, APP_BRAND_LOGO_URL } from "@/lib/branding-constants";

const settingsSections = [
  {
    key: "general",
    label: "General",
    icon: Settings,
    href: "/settings/general"
  },
  {
    key: "privacy",
    label: "Privacy",
    icon: Shield,
    href: "/settings/privacy"
  },
  {
    key: "ai-customization",
    label: "AI Customization",
    icon: Brain,
    href: "/settings/ai-customization"
  },
  {
    key: "usage",
    label: "Usage",
    icon: Plug,
    href: "/settings/usage"
  },
  {
    key: "account",
    label: "Account",
    icon: User,
    href: "/settings/account"
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-dvh flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar p-4">
        <div className="text-2xl font-semibold h-16">Settings</div>

        <nav className="space-y-2">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;

            return (
              <Link
                key={section.key}
                href={section.href}
                className={`block w-full text-left transition-colors rounded-lg ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="font-medium">{section.label}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header - Fixed, non-scrollable */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-30 border-b border-border text-foreground bg-background/80 backdrop-blur-md flex flex-col shrink-0">
          {/* Logo and brand row */}
          <div className="h-16 flex items-center justify-between px-4 py-2 shrink-0">
            <Link href="/" className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground bg-transparent px-3 py-1.5 rounded-lg select-none transition-colors">
              <Image
                src={APP_BRAND_LOGO_URL}
                alt={`${APP_BRAND_SHORT_NAME} Logo`}
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              <div className="text-xl transition-colors cursor-pointer md:text-2xl font-bold">
                {APP_BRAND_SHORT_NAME}
              </div>
            </Link>

            {/* Go Back button at the right end */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 flex items-center gap-1.5 hover:bg-accent"
                onClick={router.back}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Go Back</span>
              </Button>
            </div>
          </div>

          {/* Mobile Horizontal Navigation - Only visible on mobile */}
          {isMobile && (
            <nav className="flex overflow-x-auto horizontal-scroll px-4 py-3 gap-2 border-t border-border">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = pathname === section.href;

                return (
                  <Link
                    key={section.key}
                    href={section.href}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{section.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </header>

        {/* Settings Content - Scrollable area with proper spacing */}
        <main className="flex-1 overflow-y-auto">
          <div className={`max-w-4xl mx-auto ${isMobile ? "px-4 pt-40 pb-20" : "px-6 pt-20 pb-6"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
