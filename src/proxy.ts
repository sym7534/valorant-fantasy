import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/src/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const isAuthenticated = Boolean(request.auth);
  const isProtectedRoute =
    nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/league');

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/', nextUrl);
    redirectUrl.searchParams.set('callbackUrl', `${nextUrl.pathname}${nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (nextUrl.pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/dashboard/:path*', '/league/:path*'],
};
