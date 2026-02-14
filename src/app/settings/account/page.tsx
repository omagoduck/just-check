"use client";

/**
 * Account Settings Page
 * Allows users to view and edit their profile information.
 * Integrates with Clerk for authentication and avatar management,
 * and with custom hooks for profile data management.
 */

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/use-profile";

export default function AccountSettingsPage() {
  // Clerk authentication hook - provides current user data
  const { user, isLoaded: userLoaded } = useUser();

  // Custom hooks for profile data fetching and updates
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref to track if form has been initialized from profile data
  // Prevents overwriting user edits when profile data refetches
  const initializedRef = useRef(false);

  // Form state for profile fields
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    dateOfBirth: '',
  });

  /**
   * Initialize form data from profile when it first loads
   * Uses a ref flag to ensure we only populate the form once
   * to avoid overwriting user input on subsequent profile updates
   */
  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        fullName: profile.full_name ?? '',
        nickname: profile.nickname ?? '',
        dateOfBirth: profile.date_of_birth ?? '',
      });
    }
  }, [profile]);

  /**
   * Handle form submission
   * Updates the profile via the useUpdateProfile mutation
   * Shows success/error toast notifications
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate full name has at least 2 words
    const fullNameParts = formData.fullName.trim().split(/\s+/);
    if (fullNameParts.length < 2) {
      toast.error('Validation failed', {
        description: 'Full name must contain at least 2 words (first name and last name)',
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: formData.fullName,
        nickname: formData.nickname,
        date_of_birth: formData.dateOfBirth || undefined,
      });
      toast.success('Profile updated successfully');
      // Reset initialization flag to allow re-initialization if profile changes from outside
      initializedRef.current = false;
    } catch (error) {
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Handle input field changes
   * Updates the formData state for the specified field
   */
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle avatar file selection
   * Validates and uploads the selected file to Clerk
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please select a JPEG, PNG, WebP, or GIF image.',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum file size is 5MB.',
      });
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Profile picture uploaded!', {
        description: 'It will appear on your profile shortly.',
      });
    } catch (error) {
      toast.error('Failed to upload profile picture', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combined loading state from multiple sources
  const isLoading = profileLoading || !userLoaded || updateProfile.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile Picture Section */}
          {/* Users can upload their profile picture directly to Clerk */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                
                {/* Avatar with click-to-upload */}
                <div className="relative group">
                  <Avatar className="size-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {userLoaded && user?.imageUrl ? (
                      <AvatarImage src={user.imageUrl} alt="Profile picture" />
                    ) : (
                      <AvatarFallback>
                        <Skeleton className="size-full" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Upload overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <span className="text-white text-xs font-medium">Upload</span>
                  </div>
                  
                  {/* Loading overlay */}
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Click on your profile picture to upload a new one
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JPEG, PNG, WebP, GIF (max 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          {/* Editable fields: full name, nickname, date of birth */}
          {/* Email is read-only as it's managed through Clerk */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Enter your full name (e.g., John Doe)"
                      required
                      minLength={2}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      id="nickname"
                      value={formData.nickname}
                      onChange={(e) => handleChange('nickname', e.target.value)}
                      placeholder="Enter your nickname"
                      required
                      minLength={2}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.emailAddresses?.[0]?.emailAddress || ""}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          {/* Password management links - redirect to Clerk's password reset flow */}
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Password Actions</h3>
                <p className="text-sm text-muted-foreground">Manage your account password and recovery options</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => window.open('/sign-in?redirect_url=/forgot-password', '_self')}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => window.open('/forgot-password', '_self')}
                  >
                    Forgot Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-destructive">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" type="button">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
