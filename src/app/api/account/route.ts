import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isIdentitySignInEnabled } from '@/lib/auth/flags';

/** Authenticated status only. Do not return emails, org data or session tokens. */
export async function GET() {
  if (!isIdentitySignInEnabled()) {
    return NextResponse.json({ authenticated: false, identitySignInEnabled: false }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  return NextResponse.json({ authenticated: !error && Boolean(user?.email_confirmed_at) }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
