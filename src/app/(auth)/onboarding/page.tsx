'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, User, Calendar, Globe } from 'lucide-react'
import { validateAge } from '@/lib/age-validation'

interface FormData {
  fullName: string
  nickname: string
  dateOfBirth: string
  avatarUrl: string
}

interface FormErrors {
  [key: string]: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    nickname: '',
    dateOfBirth: '',
    avatarUrl: '',
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  // Pre-fill form with Clerk data if available
  useEffect(() => {
    if (user) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setFormData(prev => ({
        ...prev,
        fullName: fullName || '',
        avatarUrl: user.imageUrl || '',
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
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

    if (formData.avatarUrl && !formData.avatarUrl.startsWith('http')) {
      newErrors.avatarUrl = 'Avatar URL must be a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitMessage('Profile completed successfully! Redirecting...')
        
        // Enhanced token refresh with retry logic
        if (data.requiresAuthTokenRefresh) {
          console.log('🔄 Forcing token refresh with retry logic...')
          let retryCount = 0
          const maxRetries = 3
          
          while (retryCount < maxRetries) {
            try {
              await getToken({ skipCache: true })
              console.log(`✅ Token refresh attempt ${retryCount + 1} successful`)
              break
            } catch (tokenError) {
              retryCount++
              console.warn(`⚠️ Token refresh attempt ${retryCount} failed:`, tokenError)
              if (retryCount < maxRetries) {
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500))
              }
            }
          }
        }
        
        // Get return URL or default to dashboard
        const returnUrl = searchParams.get('returnUrl') || '/'
        
        // Use API-recommended delay or fallback to 2.5 seconds
        const redirectDelay = data.tokenRefreshDelay || 2500
        
        // Add delay to ensure token refresh completes before redirect
        setTimeout(() => {
          router.push(returnUrl)
        }, redirectDelay)
      } else {
        setSubmitMessage(data.error || 'Failed to complete onboarding. Please try again.')
        if (data.details) {
          console.error('Validation errors:', data.details)
        }
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      setSubmitMessage('An error occurred. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not signed in (redirect will happen)
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.avatarUrl || user?.imageUrl} />
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
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <div className="flex items-center text-sm text-red-600">
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
                className={errors.nickname ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.nickname && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.nickname}
                </div>
              )}
              <p className="text-xs text-gray-500">
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
                className={errors.dateOfBirth ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.dateOfBirth && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.dateOfBirth}
                </div>
              )}
            </div>

            {/* Avatar URL (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-sm font-medium flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Avatar URL (Optional)
              </Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatarUrl}
                onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                className={errors.avatarUrl ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.avatarUrl && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.avatarUrl}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Link to your profile picture (if different from your auth provider)
              </p>
            </div>

            {/* Success/Error Message */}
            {submitMessage && (
              <div className={`text-sm text-center p-3 rounded-md ${
                submitMessage.includes('success') 
                  ? 'text-green-700 bg-green-50 border border-green-200' 
                  : 'text-red-700 bg-red-50 border border-red-200'
              }`}>
                {submitMessage}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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