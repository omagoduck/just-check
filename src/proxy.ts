// Middleware for authentication and authorization
// Renamed from middleware.ts to proxy.ts as Vercel recently changed the name of the file in Next.js 16.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  // '/', // Right now we will not allow the user to access the root page as it is another vital page. TODO: Add feature so that user can use our chatbot even while signed out.
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
])

// Define routes that require authentication but NOT profile completion
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/api/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  console.log('🛡️ MIDDLEWARE - Processing request:', req.nextUrl.pathname)

  // Allow public routes (no authentication required)
  if (isPublicRoute(req)) {
    console.log('🟢 PUBLIC ROUTE - Allowing access:', req.nextUrl.pathname)
    return
  }

  // Protect route and get authentication data
  console.log('🔐 AUTHENTICATING - Protecting route:', req.nextUrl.pathname)
  const { userId, sessionClaims } = await auth.protect()

  console.log('✅ AUTHENTICATED - User:', userId)
  console.log('📋 SESSION CLAIMS:', {
    has_session_claims: !!sessionClaims,
    has_public_metadata: !!sessionClaims?.publicMetadata,
    profile_complete: (sessionClaims?.publicMetadata as any)?.profileComplete
  })

  // Allow onboarding routes without profile completion check
  if (isOnboardingRoute(req)) {
    console.log('🔄 ONBOARDING ROUTE - Allowing access without completion check')
    return
  }

  // Check profile completion status from JWT metadata (ZERO database calls!)
  const publicMetadata = sessionClaims?.publicMetadata as {
    profileComplete?: boolean
  } | undefined
  const profileComplete = publicMetadata?.profileComplete === true

  console.log('📊 PROFILE CHECK:', {
    has_metadata: !!publicMetadata,
    metadata: publicMetadata,
    profileComplete
  })

  // KISS: Simple boolean check
  if (profileComplete) {
    console.log('✅ PROFILE COMPLETE - Allowing access to:', req.nextUrl.pathname)
    return
  }

  // Profile is incomplete - redirect to onboarding
  console.log('⚠️ PROFILE INCOMPLETE - Redirecting to onboarding')
  const onboardingUrl = new URL('/onboarding', req.url)
  // Add return URL so user can come back after completion
  onboardingUrl.searchParams.set('returnUrl', req.url)
  // Add reason for debugging
  onboardingUrl.searchParams.set('reason', 'incomplete_profile')

  console.log('🔄 REDIRECTING TO:', onboardingUrl.toString())
  return NextResponse.redirect(onboardingUrl)
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}