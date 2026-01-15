"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy submit - just show success state
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedback("");
    }, 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Feedback</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>We'd love to hear from you</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium">Thank you for your feedback!</p>
              <p className="text-muted-foreground">We appreciate you taking the time to share your thoughts.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-muted-foreground">
                Share your thoughts, report bugs, or suggest features. Your feedback helps us improve Lumy.
              </p>

              <div className="space-y-2">
                <label htmlFor="feedback" className="text-sm font-medium">
                  Your feedback
                </label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you think..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={!feedback.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Submit feedback
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
