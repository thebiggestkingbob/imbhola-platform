import { NextResponse } from 'next/server';

/** Basic availability check. Never include secrets, tenant information or detailed infrastructure telemetry. */
export function GET() {
  return NextResponse.json(
    {
      service: 'imbhola-platform',
      status: 'ok',
      phase: 'development-foundation',
      officialSetaExports: false,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
