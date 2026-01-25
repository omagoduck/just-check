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
import { Check, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { APP_BRAND_LOGO_URL, APP_BRAND_SHORT_NAME } from "@/lib/branding-constants";

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  highlight?: boolean;
  badge?: string;
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

const teamPricing: PricingPlan = {
  name: "Team",
  description: "Collaborate and scale your AI capabilities for your business.",
  price: "Custom",
  features: [
    "Dedicated workspace",
    "Centralized billing",
    "Admin controls",
    "Advanced analytics",
    "Onboarding and training",
    "SLA and enterprise support",
  ],
  buttonText: "Contact Sales",
};

export default function UpgradePage() {
  const router = useRouter(); // Initialize useRouter

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
          {pricingPlans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col justify-between ${plan.highlight
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
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
