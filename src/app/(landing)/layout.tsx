import Link from "next/link";
import { PARENT_COMPANY_NAME } from "@/lib/branding-constants";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="text-xs text-muted-foreground/30">
            &copy; {new Date().getFullYear()} {PARENT_COMPANY_NAME}
          </span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground/50">
            <Link
              href="https://oearol.com/legal/terms"
              target="_blank"
              className="hover:text-foreground/60 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="https://oearol.com/legal/privacy"
              target="_blank"
              className="hover:text-foreground/60 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="https://oearol.com/legal"
              target="_blank"
              className="hover:text-foreground/60 transition-colors"
            >
              Legal Pages
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
