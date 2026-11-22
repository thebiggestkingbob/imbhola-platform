import { NextRequest, NextResponse } from 'next/server';
/** Fail closed until verified authentication and tenant-aware sessions exist. */
export function middleware(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/access', request.url));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
export const config = { matcher: ['/workspace/:path*', '/sdf/:path*', '/admin/:path*'] };
