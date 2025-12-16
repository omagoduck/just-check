"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function GeneralSettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">General Settings</h1>

      <div className="space-y-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" defaultValue="English" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" defaultValue="United States" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>App Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="auto-update">Auto-update app</Label>
                <p className="text-sm text-gray-500">Automatically download and install updates</p>
              </div>
              <Checkbox id="auto-update" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-sm text-gray-500">Enable dark theme for the application</p>
              </div>
              <Checkbox id="dark-mode" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="notifications">Enable notifications</Label>
                <p className="text-sm text-gray-500">Receive desktop notifications</p>
              </div>
              <Checkbox id="notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="sync-data">Sync data across devices</Label>
                <p className="text-sm text-gray-500">Keep your settings and preferences synchronized</p>
              </div>
              <Checkbox id="sync-data" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="backup">Automatic backups</Label>
                <p className="text-sm text-gray-500">Create automatic backups of your data</p>
              </div>
              <Checkbox id="backup" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
