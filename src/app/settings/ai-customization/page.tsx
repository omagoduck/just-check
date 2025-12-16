"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function AICustomizationSettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Customization</h1>

      <div className="space-y-6">
        {/* AI Personality */}
        <Card>
          <CardHeader>
            <CardTitle>AI Personality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-name">AI Name</Label>
              <Input id="ai-name" defaultValue="Lumy Assistant" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-personality">Personality Description</Label>
              <Textarea
                id="ai-personality"
                defaultValue="Friendly, helpful, and professional AI assistant"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="response-style">Response Style</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="concise" />
                  <Label htmlFor="concise">Concise</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="balanced" defaultChecked />
                  <Label htmlFor="balanced">Balanced</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="detailed" />
                  <Label htmlFor="detailed">Detailed</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>AI Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="use-emojis">Use emojis in responses</Label>
                <p className="text-sm text-gray-500">Make responses more expressive with emojis</p>
              </div>
              <Checkbox id="use-emojis" defaultChecked className="mt-1" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="formal-tone">Use formal tone</Label>
                <p className="text-sm text-gray-500">Make responses more professional and formal</p>
              </div>
              <Checkbox id="formal-tone" className="mt-1" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="code-examples">Include code examples</Label>
                <p className="text-sm text-gray-500">Provide code examples when relevant</p>
              </div>
              <Checkbox id="code-examples" defaultChecked className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Content Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-topics">Preferred Topics</Label>
              <Textarea
                id="preferred-topics"
                placeholder="List topics you're most interested in (e.g., technology, science, business)"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avoid-topics">Avoid Topics</Label>
              <Textarea
                id="avoid-topics"
                placeholder="List topics you prefer to avoid"
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="enable-plugins">Enable third-party plugins</Label>
                <p className="text-sm text-gray-500">Allow AI to use external plugins and integrations</p>
              </div>
              <Checkbox id="enable-plugins" className="mt-1" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="web-search">Enable web search</Label>
                <p className="text-sm text-gray-500">Allow AI to search the web for up-to-date information</p>
              </div>
              <Checkbox id="web-search" defaultChecked className="mt-1" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <Label htmlFor="memory">Enable conversation memory</Label>
                <p className="text-sm text-gray-500">Remember previous conversations for context</p>
              </div>
              <Checkbox id="memory" defaultChecked className="mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
