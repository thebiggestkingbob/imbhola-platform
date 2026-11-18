import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
import MfaSetup from '@/components/MfaSetup';
export const dynamic='force-dynamic';
export default async function AccountSecurity(){
 if(!isIdentitySignInEnabled())redirect('/login');
 const client=await createSupabaseServerClient();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email_confirmed_at)redirect('/login');
 return <main className="container section">
  <div className="eyebrow">SECURITY CENTER</div><h1 className="inner-title">Protect your account.</h1>
  <p className="lead">Privileged company roles require a verified authenticator before organisational records can be accessed.</p>
  <MfaSetup/>
  <Link href="/dashboard" className="text-link">Return to workspace →</Link>
 </main>;
}
