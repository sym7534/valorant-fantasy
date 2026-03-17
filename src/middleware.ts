export { auth as middleware } from '@/src/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/league/:path*',
    '/players/:path*',
    '/team-builder/:path*',
    '/settings/:path*',
  ],
}
