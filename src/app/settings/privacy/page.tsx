"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function PrivacySettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Privacy Settings</h1>

      <div className="space-y-6">
        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="share-anonymous">Share anonymous data with partners</Label>
                <p className="text-sm text-gray-500">Help our partners improve their services with anonymous data</p>
              </div>
              <Checkbox id="share-anonymous" className="mt-1" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="share-diagnostics">Share diagnostic data</Label>
                <p className="text-sm text-gray-500">Share technical data to help improve app performance</p>
              </div>
              <Checkbox id="share-diagnostics" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Data Request */}
        <Card>
          <CardHeader>
            <CardTitle>Data Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-request">Request your Lumy data</Label>
              <Textarea
                id="data-request"
                placeholder="Describe what data you would like to request or any privacy concerns you have..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
