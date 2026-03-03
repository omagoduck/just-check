'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { APP_BRAND_LOGO_URL, APP_BRAND_SHORT_NAME } from "@/lib/branding-constants";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";

// Pricing plan interface defining the structure for each plan card
interface PricingPlan {
  name: string;           // Plan name (Free, Plus, Pro, Max)
  description: string;    // Short description of the plan
  price: string;          // Display price (e.g., "$10/month")
  features: string[];     // List of features included
  buttonText: string;     // Button text for this plan
  highlight?: boolean;    // Whether to highlight this plan (e.g., "Most Popular")
  badge?: string;         // Optional badge text (e.g., "Most Popular")
  productId?: string;     // DODO product ID for checkout/upgrade
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    description: "For individuals just starting out with AI.",
    price: "$0/month",
    features: [
      "Basic chatbot access",
      "Limited message history",
      "Standard response time",
      "Community support",
    ],
    buttonText: "Get Started",
  },
  {
    name: "Plus",
    description: "More power for personal projects and advanced users.",
    price: "$10/month",
    features: [
      "All Free features",
      "Enhanced chatbot access",
      "Extended message history",
      "Faster response time",
      "Priority email support",
    ],
    buttonText: "Upgrade to Plus",
    productId: "pdt_0NWpWdXK777ZVmVKjUc4J",
  },
  {
    name: "Pro",
    description: "Unleash the full potential of AI for demanding tasks.",
    price: "$25/month",
    features: [
      "All Plus features",
      "Premium chatbot access",
      "Unlimited message history",
      "Instant response time",
      "24/7 Live chat support",
      "Advanced integrations",
    ],
    buttonText: "Upgrade to Pro",
    highlight: true,
    badge: "Most Popular",
    productId: "pdt_0NX2rc1Ua1xjdVKhj3oXW",
  },
  {
    name: "Max",
    description: "Maximum performance and exclusive features for elite users.",
    price: "$50/month",
    features: [
      "All Pro features",
      "Exclusive chatbot models",
      "Dedicated account manager",
      "Early access to new features",
      "Custom AI model training",
    ],
    buttonText: "Upgrade to Max",
  },
];

/**
 * Handles checkout for new subscriptions (users without existing subscription)
 * Creates DODO customer and redirects to checkout session
 */
async function handleCheckout(productId: string) {
  try {
    // Checkout API automatically handles customer creation/retrieval
    const checkoutResponse = await fetch(
      `/api/checkout?productId=${productId}`,
      {
        method: 'GET',
      }
    );

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await checkoutResponse.json();

    if (data.checkout_url) {
      // Redirect user to DODO checkout page
      window.location.href = data.checkout_url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to initiate checkout. Please try again.');
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: subscription } = useSubscription();  // Current subscription data
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [previewData, setPreviewData] = useState<{
    immediateCharge: number;
    currency: string;
    newPlan: any;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine current plan type from subscription (default to 'free' if none)
  const currentPlanType = subscription?.planType || 'free';

  // EFFECT: Fetch preview data when confirmation dialog opens
  useEffect(() => {
    if (showConfirmDialog && selectedPlan) {
      fetchPreviewData();
    }
  }, [showConfirmDialog, selectedPlan]);

  /**
   * Fetches plan change preview from Dodo API
   * Shows the immediate charge and new plan details
   */
  const fetchPreviewData = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewData(null);

      if (!selectedPlan?.productId) {
        setPreviewError('No product ID available for selected plan');
        setPreviewLoading(false);
        return;
      }

      const response = await fetch('/api/subscription/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: selectedPlan.productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData({
          immediateCharge: data.immediateCharge || 0,
          currency: data.currency || 'USD',
          newPlan: data.newPlan || null,
        });
      } else {
        const errorData = await response.json();
        setPreviewError(errorData.error || 'Failed to load plan preview');
      }
    } catch (error) {
      console.error('Failed to fetch preview:', error);
      setPreviewError('Network error while loading preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * Handles subscription upgrade/change for existing subscribers
   * Calls the update API which uses Dodo's automatic proration
   */
  const handleUpdateSubscription = async (productId: string) => {
    try {
      setLoadingPlan(selectedPlan?.name || null);
      setErrorMessage(null);
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      await response.json();

      // Show success dialog
      setShowConfirmDialog(false);
      setPreviewData(null);
      setPreviewError(null);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Update error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update subscription. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  /**
   * Handles plan card button clicks
   * Routes based on user's current subscription status:
   * - Clicking current plan: redirect to home
   * - Existing subscriber changing plan: show confirmation dialog
   * - New user (free/no subscription): redirect to checkout
   * - Not authenticated: show alert
   */
  const handlePlanClick = (plan: PricingPlan) => {
    if (plan.name.toLowerCase() === currentPlanType) {
      // User clicked their current plan - go to app
      window.location.href = '/';
    } else if (subscription && subscription.planType !== 'free') {
      // User has an existing paid subscription and wants to change
      // Show confirmation dialog with credit calculation
      setSelectedPlan(plan);
      setShowConfirmDialog(true);
    } else if (plan.productId && userId) {
      // User is on free plan or no subscription - new checkout flow
      setLoadingPlan(plan.name);
      handleCheckout(plan.productId);
    } else if (!userId) {
      // Not authenticated
      alert('Please sign in to upgrade');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 shrink-0 bg-background/80 backdrop-blur-md h-header-height text-foreground px-1 sm:px-2 flex items-center border-b border-border">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            {/* Back button for navigation */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()} // Use router.back() for navigation
              className="p-2 hover:bg-accent hover:text-accent-foreground bg-transparent rounded-lg select-none transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </Button>

            {/* Lumy logo and name linking to homepage */}
            <Link href="/" className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground bg-transparent px-3 py-1.5 rounded-lg select-none transition-colors">
              <Image
                src={APP_BRAND_LOGO_URL}
                alt={`${APP_BRAND_SHORT_NAME} Logo`}
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              <div className="text-xl text-foreground/90 hover:text-accent-foreground transition-colors cursor-pointer md:text-2xl font-bold">{APP_BRAND_SHORT_NAME}</div>
            </Link>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Unlock the full potential of our AI chatbot with a plan that fits your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan) => {
            const isCurrentPlan = plan.name.toLowerCase() === currentPlanType;

            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col justify-between ${isCurrentPlan
                  ? "border-primary/80"
                  : plan.highlight
                  ? "border-primary ring-2 ring-primary scale-105"
                  : ""
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-0 -mr-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground shadow-md">
                    {plan.badge}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="grow">
                  <div className="text-3xl font-bold mb-4">
                    {plan.price.split("/")[0]}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.price.split("/")[1]}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-foreground">
                        <Check className="text-chart-1 mr-2 size-5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan === plan.name}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      isCurrentPlan ? "Continue to App" : plan.buttonText
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog for Subscription Update */}
      {/* Shows when user clicks a different plan card (existing subscriber) */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        setShowConfirmDialog(open);
        if (!open) {
          setPreviewData(null);
          setPreviewError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <div className="space-y-4">
              {/* Main change summary */}
              <p className="text-muted-foreground text-sm">
                You are about to change your subscription from{" "}
                <span className="font-semibold capitalize">{currentPlanType}</span> to{" "}
                <span className="font-semibold capitalize">{selectedPlan?.name}</span>.
              </p>

              {/* Dodo Preview Section - Shows immediate charge */}
              {previewLoading && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading preview...</span>
                </div>
              )}

              {!previewLoading && previewError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-semibold">Preview unavailable</p>
                  <p>{previewError}</p>
                  <p className="mt-1 text-xs">You can still proceed, but the exact charge amount may vary.</p>
                </div>
              )}

              {!previewLoading && previewData && (
                <div className="space-y-2 rounded-md bg-muted p-3">
                  <p className="text-sm font-medium">Plan Change Preview</p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">New plan:</span>{" "}
                    <span className="font-semibold">{selectedPlan?.name}</span>{" "}
                    <span className="text-muted-foreground">({selectedPlan?.price})</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Immediate charge:</span>{" "}
                    <span className="font-bold text-primary">
                      {(previewData.immediateCharge / 100).toFixed(2)} {previewData.currency}
                    </span>
                  </div>
                </div>
              )}


              {/* Important note about billing */}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                This change will take effect immediately with automatic proration.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPreviewData(null);
                setPreviewError(null);
              }}
              disabled={loadingPlan === selectedPlan?.name}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPlan && handleUpdateSubscription(selectedPlan.productId!)}
              disabled={loadingPlan === selectedPlan?.name || previewLoading || (previewError === null && !previewData)}
            >
              {loadingPlan === selectedPlan?.name ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : previewLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Shows after successful upgrade */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          // Hard refresh the page when modal closes to ensure all data is fresh
          if (!open) {
            window.location.reload();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600 dark:text-green-400">
              Upgrade Request Successful!
            </DialogTitle>
            <div className="space-y-3 pt-2 text-muted-foreground">
              <p className="text-sm">
                Your subscription has been changed from{" "}
                <span className="font-semibold capitalize">{currentPlanType}</span> to{" "}
                <span className="font-semibold capitalize">{selectedPlan?.name}</span>.
              </p>

              {previewData && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Amount charged:</span>{" "}
                  <span className="font-bold text-primary">
                    {(previewData.immediateCharge / 100).toFixed(2)} {previewData.currency}
                  </span>
                </p>
              )}

              <p className="text-xs text-muted-foreground pt-2 border-t">
                The change has taken effect immediately. You can now continue to the app.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                window.location.href = '/';
              }}
            >
              Continue to App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog - Shows when upgrade fails */}
      <Dialog open={!!errorMessage} onOpenChange={() => {
        setErrorMessage(null);
        setShowConfirmDialog(false);
        setSelectedPlan(null);
        setPreviewData(null);
        setPreviewError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Upgrade Request Failed
            </DialogTitle>
            <div className="space-y-3 pt-2 text-muted-foreground">
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <p className="text-xs text-muted-foreground border-t pt-2">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setErrorMessage(null);
                setShowConfirmDialog(false);
                setSelectedPlan(null);
                setPreviewData(null);
                setPreviewError(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
