'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, User, Calendar, Globe, Loader2 } from 'lucide-react'
import { validateAge } from '@/lib/age-validation'

interface FormData {
  fullName: string
  nickname: string
  dateOfBirth: string
}

// TODO: Add avatar update option later with proper infrastructure and system

interface FormErrors {
  [key: string]: string
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nickname: '',
    dateOfBirth: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Pre-fill form with Clerk data if available
  useEffect(() => {
    if (user) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setFormData(prev => ({
        ...prev,
        fullName: fullName || '',
      }))
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const completeOnboarding = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Failed to complete onboarding')
      return response.json()
    },
    onSuccess: async (data) => {
      // Token refresh logic
      if (data.requiresAuthTokenRefresh) {
        for (let i = 0; i < 3; i++) {
          try {
            await getToken({ skipCache: true })
            break
          } catch { await new Promise(r => setTimeout(r, Math.pow(2, i) * 500)) }
        }
      }
      // Redirect
      setTimeout(() => router.push(searchParams.get('returnUrl') || '/'), data.tokenRefreshDelay || 2500)
    }
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    } else {
      const nameParts = formData.fullName.trim().split(/\s+/)
      if (nameParts.length < 2) {
        newErrors.fullName = 'Full name must contain at least 2 words (first name and last name)'
      }
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Nickname is required'
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = 'Nickname must be at least 2 characters'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    } else {
      const ageValidation = validateAge(formData.dateOfBirth, 1, 150)
      if (!ageValidation.isValid) {
        newErrors.dateOfBirth = ageValidation.error || 'Invalid date of birth'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      completeOnboarding.mutate(formData)
    }
  }

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if not signed in (redirect will happen)
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide the following information to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name (e.g., John Doe)"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
                disabled={completeOnboarding.isPending}
              />
              {errors.fullName && (
                <div className="flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium">
                Nickname *
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="What should we call you?"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className={errors.nickname ? 'border-destructive' : ''}
                disabled={completeOnboarding.isPending}
              />
              {errors.nickname && (
                <div className="flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.nickname}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                This name will be used for short references.
              </p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date of Birth *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-destructive' : ''}
                disabled={completeOnboarding.isPending}
              />
              {errors.dateOfBirth && (
                <div className="flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.dateOfBirth}
                </div>
              )}
            </div>



            {/* Error Message */}
            {completeOnboarding.error && (
              <div className="text-sm text-center p-3 rounded-md text-destructive bg-destructive/10 border border-destructive/20">
                {completeOnboarding.error.message}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={completeOnboarding.isPending}
              className="mt-4 w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {completeOnboarding.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Saving Profile...
                </div>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// The current edit to this file and respective git commit is to avoid a build error.
// TODO: Investigate and learn what was causing the build error in this file even if it was a client file.
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
