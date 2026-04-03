"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

export default function GeneralSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">General Settings</h1>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === "system"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">System</span>
                </button>

                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === "light"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium">Day</span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${theme === "dark"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium">Night</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
