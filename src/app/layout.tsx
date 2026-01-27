import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from '@clerk/themes'
import { QueryProvider } from "@/providers/query-provider"
import { SettingsLoader } from "@/components/settings-loader"
import type { Viewport } from 'next';
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumy Alpha",
  description: "Chat with Lumy Alpha",
};

export const viewport: Viewport = {
  width: 'device-width',
  interactiveWidget: 'resizes-content', // This tells the browser to resize the viewport area when the keyboard opens
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider appearance={{ baseTheme: shadcn }}>
            <QueryProvider>
              <SettingsLoader> {/* This will load the settings at launching the app, which is extremely important */}
                {children}
                <Toaster position="top-right" />
              </SettingsLoader>
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
