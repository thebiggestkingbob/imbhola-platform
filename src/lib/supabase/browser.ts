'use client';
import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseConfig } from './config';

/** Browser client uses only the public publishable key; database RLS remains authoritative. */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
