"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsValue, useUpdateSettings } from "@/hooks/use-settings";

export default function PrivacySettingsPage() {
  const settings = useSettingsValue();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();

  const handleCheckboxChange = (field: keyof typeof settings.privacySettings, checked: boolean) => {
    updateSettings({
      privacySettings: { ...settings.privacySettings, [field]: checked }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Privacy Settings</h1>
        {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
      </div>

      <div className="space-y-6">
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
              <Checkbox
                id="share-anonymous"
                className="mt-1"
                checked={settings.privacySettings.shareAnonymousData}
                onCheckedChange={(checked) => handleCheckboxChange('shareAnonymousData', Boolean(checked))}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="share-diagnostics">Share diagnostic data</Label>
                <p className="text-sm text-gray-500">Share technical data to help improve app performance</p>
              </div>
              <Checkbox
                id="share-diagnostics"
                className="mt-1"
                checked={settings.privacySettings.shareDiagnostics}
                onCheckedChange={(checked) => handleCheckboxChange('shareDiagnostics', Boolean(checked))}
              />
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
