'use client';

import { useActionState } from 'react';
import { signInAction } from '@/lib/auth/actions';

const initialState = { error: '' };

export default function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);
  return <form action={action} className="identity-form">
    <label htmlFor="imbhola-email">Email address</label>
    <input id="imbhola-email" name="email" type="email" autoComplete="username"
      required maxLength={254} placeholder="you@company.co.za" />
    <label htmlFor="imbhola-password">Password</label>
    <input id="imbhola-password" name="password" type="password" autoComplete="current-password"
      required minLength={1} maxLength={1024} />
    {state.error && <p className="identity-error" role="alert">{state.error}</p>}
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Verifying account…' : 'Sign in securely'}
    </button>
    <p className="identity-note">Only previously verified and authorised accounts can access an organisation workspace. Company sign-up is not open.</p>
  </form>;
}
