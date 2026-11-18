import Link from 'next/link';
import AccountRegistrationForm from '@/components/AccountRegistrationForm';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
export const dynamic='force-dynamic';
export default function Signup(){
 const enabled=isIdentitySignInEnabled()&&process.env.IMBHOLA_AUTH_SIGNUP_ENABLED==='true';
 return <main className="container section">
  <div className="eyebrow">VERIFIED ACCOUNT REGISTRATION</div>
  <h1 className="inner-title">Begin with your identity.</h1>
  <p className="lead">Create a verified account to request employer onboarding or accept an approved team invitation. A user account never automatically grants company access.</p>
  {enabled?<AccountRegistrationForm/>:<p className="notice">Self-registration is currently closed. Imbhola is preparing its secure employer onboarding programme.</p>}
  <Link href="/login" className="text-link">Already registered? Sign in →</Link>
 </main>;
}