import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Special case: Handle /undefined/dashboard - redirect to auth to select a role
  if (path === '/undefined/dashboard' || path.startsWith('/undefined/')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Check what type of path we're dealing with
  const isAuthPath = path === '/auth';
  const isApplyRolePath = path === '/auth/apply-role';
  const isDashboardRedirectPath = path === '/dashboard-redirect';
  const isApiPath = path.startsWith('/api/');
  const isRootPath = path === '/';
  
  // Don't run middleware for API routes
  if (isApiPath) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check URL params
  const hasTimestamp = request.nextUrl.searchParams.has('ts');
  const urlRole = request.nextUrl.searchParams.get('role');
  
  // Allow all requests with a timestamp (fresh redirects)
  if (hasTimestamp) {
    return NextResponse.next();
  }

  // Handle root path
  if (isRootPath) {
    if (token && token.role) {
      return NextResponse.redirect(new URL(`/${token.role}/dashboard`, request.url));
    }
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Allow access to auth pages
  if (isAuthPath || isApplyRolePath || isDashboardRedirectPath) {
    // If authenticated with role on auth page, redirect to dashboard
    if (isAuthPath && token && token.role) {
      return NextResponse.redirect(new URL(`/${token.role}/dashboard`, request.url));
    }
    return NextResponse.next();
  }
  
  // Protect routes - require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Handle missing role for role-specific paths
  if (!token.role && (path.startsWith('/student/') || path.startsWith('/teacher/'))) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Handle role mismatch
  if (token.role === 'student' && path.startsWith('/teacher/')) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }
  
  if (token.role === 'teacher' && path.startsWith('/student/')) {
    return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Match all routes except static files, images, etc.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 