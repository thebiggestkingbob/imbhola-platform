/** Public configuration only. Never expose Supabase service-role or secret keys. */
export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Imbhola Supabase public configuration is missing.');
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    throw new Error('Invalid Supabase project URL.');
  }
  return { url, publishableKey };
}
