import Link from 'next/link';
import SignInForm from '@/components/SignInForm';
import { isIdentitySignInEnabled } from '@/lib/auth/flags';

export const dynamic = 'force-dynamic';

export default function Login() {
  const enabled = isIdentitySignInEnabled();
  return <main className="container section">
    <div className="eyebrow">SECURE ACCOUNT ACCESS</div>
    <h1 className="inner-title">Sign in to Imbhola.</h1>
    <p className="lead">Your account and organisation access must be verified before company information can be viewed.</p>
    {enabled ?
      <SignInForm /> :
      <p className="notice" role="status">Sign-in is not active in this development environment. No credentials are collected on this page.</p>
    }
    <p className="identity-note">New company registration is not open. Organisation access is issued only after verification and explicit approval.</p>
    <Link className="text-link" href="/">Back to the website →</Link>
  </main>;
}
