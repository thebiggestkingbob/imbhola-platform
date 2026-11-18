import PasswordRecoveryForm from '@/components/PasswordRecoveryForm';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
export const dynamic='force-dynamic';
export default function ForgotPassword(){return <main className="container section">
 <div className="eyebrow">ACCOUNT SECURITY</div>
 <h1 className="inner-title">Recover your account.</h1>
 {isIdentitySignInEnabled()?<PasswordRecoveryForm/>:<p className="notice">Account recovery is not enabled in this environment.</p>}
 </main>;}
