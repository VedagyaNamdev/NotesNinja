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
  
  // Don't run middleware for API routes
  if (isApiPath) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log('Path:', path, 'Token:', token ? 'exists' : 'none', 'Role:', token?.role);

  // This is a special case for redirects after role selection
  // Completely bypass any role checking during the role selection flow
  if (request.nextUrl.searchParams.has('newRole')) {
    console.log('Bypassing middleware redirects due to newRole parameter');
    return NextResponse.next();
  }

  // Role selection flow logic
  if (isAuthPath) {
    // Let users access auth page even if authenticated
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
  
  // REMOVING THE ROLE-SPECIFIC ROUTE REDIRECTIONS TO FIX THE ISSUE
  // Let the users access the route they requested without redirecting based on role
  
  return NextResponse.next();
}

// Match all routes except static files, images, etc.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 