"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AICustomizationSettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Customization</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your AI's Personality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai-nickname">AI Nickname</Label>
              <Input id="ai-nickname" placeholder="What you want to call the AI" />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="ai-tone">AI Tone</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="ai-tone" className="w-full">
                    <SelectValue placeholder="Select AI tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="warmer">Warmer</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="gen-z">Gen Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="response-length">Response Length</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="response-length" className="w-full">
                    <SelectValue placeholder="Select response length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="detail">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-instructions">Custom Instructions</Label>
              <Textarea
                id="custom-instructions"
                placeholder="Add any specific instructions or preferences for how the AI should behave..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-nickname">Your Nickname</Label>
              <Input id="user-nickname" placeholder="What AI will call you" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-profession">Your Profession</Label>
              <Input id="user-profession" placeholder="e.g., Software Engineer, Doctor, Student" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-topics">Preferred Topics</Label>
              <Textarea
                id="preferred-topics"
                placeholder="List topics you're most interested in (e.g., technology, science, business)"
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avoid-topics">Avoid Topics</Label>
              <Textarea
                id="avoid-topics"
                placeholder="List topics you prefer to avoid"
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="more-about-you">More About You</Label>
              <Textarea
                id="more-about-you"
                placeholder="Tell us more about yourself, your interests, hobbies, or anything else you'd like to share..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
