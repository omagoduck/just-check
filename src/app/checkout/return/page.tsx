// TODO: P5. This page is so static and doesn't validate if the user actually has a subscription, though it doesn't affect other part of the app, cause at the end database has the source of truth.
// So it needs some update to validate if the user actually has a subscription.
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_BRAND_LOGO_URL, APP_BRAND_NAME } from "@/lib/branding-constants";

export default function CheckoutReturnPage() {
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-50 shrink-0 bg-background/80 backdrop-blur-md h-header-height text-foreground px-1 sm:px-2 flex items-center border-b border-border">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="p-2 hover:bg-accent hover:text-accent-foreground bg-transparent rounded-lg select-none transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </Button>

            <Link href="/" className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground bg-transparent px-3 py-1.5 rounded-lg select-none transition-colors">
              <Image
                src={APP_BRAND_LOGO_URL}
                alt={`${APP_BRAND_NAME} Logo`}
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              <div className="text-xl text-foreground/90 hover:text-accent-foreground transition-colors cursor-pointer md:text-2xl font-bold">{APP_BRAND_NAME}</div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-(--spacing(48)))]">
        <Card className="max-w-md w-full text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Thank you for upgrading your {APP_BRAND_NAME} plan. Your account has been successfully upgraded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => router.push("/")} className="flex-1">
                Start Chatting
              </Button>
              <Button variant="outline" onClick={() => router.push("/settings/usage")} className="flex-1">
                Usage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
