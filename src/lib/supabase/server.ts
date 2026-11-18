import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getPublicSupabaseConfig } from './config';

/**
 * Request-scoped Supabase client.
 * Never trusts cookie data by itself; use auth.getUser() and server-side
 * authorization on every protected operation.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name:string; value:string; options:CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot persist refreshed cookies.
          // Auth refresh must also be handled in request middleware.
        }
      },
    },
  });
}
