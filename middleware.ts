import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/ai', '/profile', '/solve'];

// Auth routes that should redirect to dashboard if user is logged in
const authRoutes = ['/auth', '/'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  // Check if current route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(route));

  // Redirect logic
  if (isProtectedRoute && !user) {
    // User is not authenticated and trying to access protected route
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (isAuthRoute && user) {
    // User is authenticated and trying to access auth routes
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
