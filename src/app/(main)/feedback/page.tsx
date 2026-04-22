"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Image as ImageIcon, Loader2, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

const FEEDBACK_CATEGORIES = [
  { value: "bug-report", label: "Bug Report" },
  { value: "feature-request", label: "Feature Request" },
  { value: "general-feedback", label: "General Feedback" },
  { value: "ux-ui-issue", label: "UX/UI Issue" },
  { value: "performance-issue", label: "Performance Issue" },
  { value: "other", label: "Other" },
] as const;

type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

const FEEDBACK_CATEGORY_VALUES = FEEDBACK_CATEGORIES.map(({ value }) => value);
const MAX_FEEDBACK_MESSAGE_LENGTH = 5000;
const MAX_FEEDBACK_IMAGES = 3;
const MAX_FEEDBACK_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_FEEDBACK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SelectedFeedbackImage {
  id: string;
  file: File;
  previewUrl: string;
}

function isFeedbackCategory(value: string): value is FeedbackCategory {
  return FEEDBACK_CATEGORY_VALUES.includes(value as FeedbackCategory);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, unitIndex)).toFixed(1)} ${units[unitIndex]}`;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<SelectedFeedbackImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedFeedbackImage[]>([]);

  const trimmedFeedback = feedback.trim();
  const isOverLimit = feedback.length > MAX_FEEDBACK_MESSAGE_LENGTH;
  const canSubmit = useMemo(
    () => Boolean(trimmedFeedback && category && !isOverLimit && !isSubmitting),
    [category, isOverLimit, isSubmitting, trimmedFeedback]
  );

  const handleCategoryChange = (value: string) => {
    if (isFeedbackCategory(value)) {
      setCategory(value);
    }
  };

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    const availableSlots = MAX_FEEDBACK_IMAGES - images.length;
    if (availableSlots <= 0) {
      toast.error("Maximum images reached", {
        description: `You can attach up to ${MAX_FEEDBACK_IMAGES} images.`,
      });
      return;
    }

    const filesToAdd: SelectedFeedbackImage[] = [];
    let rejectedCount = 0;

    for (const file of selectedFiles.slice(0, availableSlots)) {
      if (!SUPPORTED_FEEDBACK_IMAGE_TYPES.includes(file.type)) {
        rejectedCount++;
        toast.error("Unsupported image type", {
          description: `${file.name} must be a JPEG, PNG, or WebP image.`,
        });
        continue;
      }

      if (file.size > MAX_FEEDBACK_IMAGE_SIZE) {
        rejectedCount++;
        toast.error("Image is too large", {
          description: `${file.name} must be ${formatFileSize(MAX_FEEDBACK_IMAGE_SIZE)} or smaller.`,
        });
        continue;
      }

      filesToAdd.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (selectedFiles.length > availableSlots) {
      rejectedCount += selectedFiles.length - availableSlots;
      toast.error("Too many images", {
        description: `Only ${availableSlots} image${availableSlots === 1 ? "" : "s"} added. Maximum ${MAX_FEEDBACK_IMAGES} images allowed.`,
      });
    }

    if (rejectedCount > 0 && filesToAdd.length === 0) return;
    setImages((current) => [...current, ...filesToAdd]);
  };

  const removeImage = (imageId: string) => {
    setImages((current) => {
      const imageToRemove = current.find(({ id }) => id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return current.filter(({ id }) => id !== imageId);
    });
  };

  const clearImages = () => {
    images.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setImages([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("message", trimmedFeedback);
      images.forEach(({ file }) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "X-Feedback-Source": window.location.pathname,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setFeedback("");
      setCategory("");
      clearImages();
      toast.success("Feedback submitted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit feedback";
      toast.error("Feedback failed to submit", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Feedback</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>We would love to hear from you</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium">Thank you for your feedback!</p>
              <p className="text-muted-foreground">We appreciate you taking the time to share your thoughts.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                Submit another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-muted-foreground">
                Share your thoughts, report bugs, or suggest features. Your feedback helps us improve Lumy.
              </p>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={handleCategoryChange} disabled={isSubmitting}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Your feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you think..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={MAX_FEEDBACK_MESSAGE_LENGTH + 1}
                  rows={6}
                  required
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <p aria-live="polite">
                    {isOverLimit ? "Feedback is too long." : " "}
                  </p>
                  <p>{feedback.length}/{MAX_FEEDBACK_MESSAGE_LENGTH}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="feedback-images">Images</Label>
                    <p className="text-xs text-muted-foreground">
                      Optional screenshots, up to {MAX_FEEDBACK_IMAGES} images.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || images.length >= MAX_FEEDBACK_IMAGES}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add image
                  </Button>
                  <input
                    ref={imageInputRef}
                    id="feedback-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageSelection}
                    disabled={isSubmitting}
                  />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {images.map(({ id, file, previewUrl }) => (
                      <div key={id} className="relative overflow-hidden rounded-md border bg-muted/30">
                        <NextImage
                          src={previewUrl}
                          alt={file.name}
                          width={320}
                          height={180}
                          unoptimized
                          className="aspect-video w-full object-cover"
                        />
                        <div className="flex items-start justify-between gap-2 p-2">
                          <div className="min-w-0 text-xs">
                            <p className="truncate font-medium">{file.name}</p>
                            <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            disabled={isSubmitting}
                            onClick={() => removeImage(id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit feedback"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
