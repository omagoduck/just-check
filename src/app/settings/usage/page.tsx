"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import Link from "next/link";

export default function UsagePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your usage progress for the current month
        </p>
      </div>

      {/* Current Plan and Upgrade Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <Info className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Free Plan</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Jan 1, 2025 - Jan 31, 2025
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Upgrade Plan
              <Info className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">•</span>
                <span>Extended message history</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">•</span>
                <span>Faster response times</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">•</span>
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
            Track your usage progress for the current month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Usage Progress</span>
              <span className="text-sm font-medium">76%</span>
            </div>

            {/* Progress Bar with Primary Color */}
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: "76%" }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
