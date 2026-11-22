import { NextRequest, NextResponse } from 'next/server';
import { localWorkspaceEnabled } from './local/mode';

export function middleware(request: NextRequest) {
  const response = localWorkspaceEnabled() ? NextResponse.next() : NextResponse.redirect(new URL('/access', request.url));
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: [
  '/dashboard/:path*', '/workspace/:path*', '/sdf/:path*', '/admin/:path*',
  '/evidence/:path*', '/report-snapshot/:path*', '/report-review/:path*',
] };
