import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Check if the path is public, auth-related, or API
  const isAuthPath = path === '/auth';
  const isApplyRolePath = path === '/auth/apply-role';
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

  // Check URL params for newRole which indicates a custom redirect
  const hasNewRole = request.nextUrl.searchParams.has('newRole');
  const retry = request.nextUrl.searchParams.get('retry');
  
  console.log('Path:', path, 'Token:', token ? 'exists' : 'none', 'Role:', token?.role, 
    'NewRole:', hasNewRole, 'Retry:', retry);

  // This is a special case for redirects after role selection
  // Completely bypass any role checking during the role selection flow
  if (hasNewRole) {
    console.log('Bypassing middleware redirects due to newRole parameter');
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
  
  // If user is authenticated but has no role and is accessing a protected route
  // that requires a role (student/teacher dashboards), redirect to apply-role
  if (token && !token.role && (path.startsWith('/student/') || path.startsWith('/teacher/'))) {
    return NextResponse.redirect(new URL('/auth/apply-role', request.url));
  }
  
  // Role-specific route redirections - BUT ONLY IF THE USER IS TRYING TO ACCESS THE WRONG ROLE
  if (token && token.role) {
    // Check for explicit cross-role access only - don't redirect if they're already in their role
    if (token.role === 'student' && path.startsWith('/teacher/')) {
      console.log('Student trying to access teacher routes, redirecting to student dashboard');
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (token.role === 'teacher' && path.startsWith('/student/')) {
      console.log('Teacher trying to access student routes, redirecting to teacher dashboard');
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
    }
  }
  
  // For all other cases, allow access
  console.log('Allowing access to', path);
  return NextResponse.next();
}

// Match all routes except static files, images, etc.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 