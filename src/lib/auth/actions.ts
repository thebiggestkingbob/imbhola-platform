'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isIdentitySignInEnabled } from './flags';

type SignInState = { error: string };

export async function signInAction(_previousState: SignInState, formData: FormData): Promise<SignInState> {
  if (!isIdentitySignInEnabled()) {
    return { error: 'Sign-in is not available in this development preview.' };
  }

  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Enter a valid email and password.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      password.length < 1 || password.length > 1024) {
    return { error: 'Enter a valid email and password.' };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error) {
    // Avoid revealing whether an account exists.
    return { error: 'Could not sign in. Check your credentials or try again later.' };
  }

  const { data: { user }, error: verificationError } = await client.auth.getUser();
  if (verificationError || !user?.email_confirmed_at) {
    await client.auth.signOut();
    return { error: 'A verified account is required to access Imbhola.' };
  }

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  const client = await createSupabaseServerClient();
  await client.auth.signOut();
  redirect('/login');
}
