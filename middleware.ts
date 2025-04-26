import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Don't redirect if the URL has a 'noredirect' parameter to break redirect loops
  if (request.nextUrl.searchParams.has('noredirect')) {
    return NextResponse.next();
  }

  // Check if this is an API path
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

  // Public paths that don't require authentication or user role
  const publicPaths = ['/auth', '/auth/signin', '/auth/error', '/auth/apply-role'];
  const isPublicPath = publicPaths.some(publicPath => path === publicPath);

  // Handle root path
  if (path === '/') {
    if (token) {
      // User has a valid token, redirect to dashboard
      const role = token.role || 'student';
      return NextResponse.redirect(new URL(`/${role}/dashboard?noredirect=true`, request.url));
    }
    // No token, redirect to auth
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // If user is on an auth page but already authenticated
  if (isPublicPath && token) {
    const role = token.role || 'student';
    return NextResponse.redirect(new URL(`/${role}/dashboard?noredirect=true`, request.url));
    }
  
  // Allow access to public pages
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to auth page
  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  
  // From this point, user is authenticated
  
  // Special case: Handle /undefined/dashboard - redirect to a real dashboard
  if (path === '/undefined/dashboard' || path.startsWith('/undefined/')) {
    const role = token.role || 'student';
    return NextResponse.redirect(new URL(`/${role}/dashboard?noredirect=true`, request.url));
  }
  
  // Get path role (student or teacher)
  const pathRole = path.startsWith('/student/') ? 'student' : 
                   path.startsWith('/teacher/') ? 'teacher' : null;
                   
  // If user has no role but is on a role-specific page
  if (!token.role && pathRole) {
    // Use the path to assign a role for this session
    return NextResponse.next();
  }
  
  // If user has a role but is on the wrong role's path
  if (token.role && pathRole && token.role !== pathRole) {
    return NextResponse.redirect(new URL(`/${token.role}/dashboard?noredirect=true`, request.url));
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