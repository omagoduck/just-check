"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUsage } from "@/hooks/use-usage";

export default function UsagePage() {
  const { data, isLoading, error } = useUsage();

  // Format date range with time
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Determine progress bar color
  const getBarColor = (percentage: number) => {
    return percentage <= 20 ? 'bg-yellow-500' : 'bg-primary';
  };

  // Calculate scale for >100% cases
  const getScaleInfo = (percentage: number) => {
    if (percentage <= 100) {
      return { leftLabel: '0%', rightLabel: '100%', barWidth: percentage, showScaled100: false };
    }
    // For >100%, scale the 100% marker inward
    const scaled100Pos = Math.round((100 / percentage) * 100);
    // Hide marker if it would overlap with edge labels (within 5% of either edge)
    const showScaled100 = scaled100Pos > 5 && scaled100Pos < 95;
    // If marker is hidden, show "0 to 100%" on left to indicate scale
    const leftLabel = showScaled100 ? '0%' : '0-100%';
    return {
      leftLabel,
      rightLabel: `${Math.round(percentage)}%`,
      barWidth: 100,
      showScaled100,
      scaled100Pos,
    };
  };

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Usage</h1>
        </div>

        {/* Current Plan and Upgrade Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Plan Card Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>

          {/* Upgrade Card Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Monthly Usage Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Usage</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-500">Failed to load usage data</div>
          </CardContent>
        </Card>
      </>
    );
  }

  const percentage = data?.remainingPercentage ?? 0;
  const scaleInfo = getScaleInfo(percentage);
  const barColor = getBarColor(percentage);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Usage</h1>
      </div>

      {/* Current Plan and Upgrade Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{data?.plan ?? 'Free'}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatDate(data?.periodStart)} - {formatDate(data?.periodEnd)}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Extended message history</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Faster response times</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-primary">•</span>
                <span>Priority support</span>
              </li>
            </ul>

            <Link href="/upgrade" passHref className="block">
              <Button className="w-full">
                Upgrade to Higher Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            Track your remaining allowance for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Remaining Allowance</span>
              <span className="text-sm font-medium">{percentage}%</span>
            </div>

            {/* Progress Bar with dynamic color and scaling */}
            <div className="w-full bg-muted rounded-full h-3 relative">
              <div
                className={`h-3 rounded-full transition-all duration-300 ease-in-out ${barColor}`}
                style={{ width: `${scaleInfo.barWidth}%` }}
              ></div>
              {/* Scaled 100% marker for >100% cases */}
              {scaleInfo.showScaled100 && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary-foreground/60"
                  style={{ left: `${scaleInfo.scaled100Pos}%` }}
                  title="100% of original allowance"
                ></div>
              )}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground relative">
              <span>{scaleInfo.leftLabel}</span>
              <span>{scaleInfo.rightLabel}</span>
              {/* Position the 100% marker at the scaled position for >100% */}
              {scaleInfo.showScaled100 && (
                <span
                  className="absolute"
                  style={{ left: `${scaleInfo.scaled100Pos}%`, transform: 'translateX(-50%)' }}
                >
                  100%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
