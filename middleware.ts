import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Check if the path is public, auth-related, or API
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

  // Check URL params that would bypass middleware
  const hasNewRole = request.nextUrl.searchParams.has('newRole');
  const hasForce = request.nextUrl.searchParams.has('force');
  const hasFromRedirect = request.nextUrl.searchParams.has('fromRedirect');
  const urlRole = request.nextUrl.searchParams.get('role');
  
  console.log('Path:', path, 'Token:', token ? 'exists' : 'none', 'Role:', token?.role, 
    'URL Role:', urlRole, 'HasForce:', hasForce, 'FromRedirect:', hasFromRedirect);

  // Special cases for bypassing middleware redirects
  if (hasNewRole || hasForce || hasFromRedirect) {
    console.log('Bypassing middleware redirects due to special URL parameters');
    return NextResponse.next();
  }

  // Dashboard redirect page should not be redirected
  if (isDashboardRedirectPath) {
    console.log('Allowing access to dashboard redirect page');
    return NextResponse.next();
  }

  // Role selection flow logic
  if (isAuthPath) {
    // If authenticated with role, redirect to appropriate dashboard
    if (token && token.role) {
      console.log(`User is authenticated with role ${token.role}, redirecting to dashboard`);
      return NextResponse.redirect(new URL(`/${token.role}/dashboard`, request.url));
    }
    // Let users access auth page even if authenticated without role
    return NextResponse.next();
  }
  
  if (isApplyRolePath) {
    if (!token) {
      // Not authenticated, redirect to auth page
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    // Let authenticated users apply role
    return NextResponse.next();
  }
  
  // Handle root path redirection
  if (isRootPath) {
    if (token && token.role) {
      // Redirect to role-specific dashboard
      console.log(`Root path, redirecting to ${token.role} dashboard`);
      return NextResponse.redirect(new URL(`/${token.role}/dashboard`, request.url));
    }
    // Redirect to auth page if not authenticated or no role
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // Protected routes logic
  
  // Redirect unauthenticated users to login page
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // If user is authenticated but has no role, redirect to apply-role
  if (token && !token.role && (path.startsWith('/student/') || path.startsWith('/teacher/'))) {
    return NextResponse.redirect(new URL('/auth/apply-role', request.url));
  }
  
  // For all other cases, allow access - remove cross-role restrictions
  // This is important to fix the issue where users were being forced to student role
  console.log('Allowing access to', path);
  return NextResponse.next();
}

// Match all routes except static files, images, etc.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 