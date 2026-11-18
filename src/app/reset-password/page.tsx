import NewPasswordForm from '@/components/NewPasswordForm';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
export const dynamic='force-dynamic';
export default function ResetPassword(){return <main className="container section">
 <div className="eyebrow">ACCOUNT SECURITY</div>
 <h1 className="inner-title">Choose a new password.</h1>
 {isIdentitySignInEnabled()?<NewPasswordForm/>:<p className="notice">Password changes are not enabled in this environment.</p>}
 </main>;}
