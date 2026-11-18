import 'server-only';
import {notFound} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';

export async function requirePlatformOperator(){
 if(!isIdentitySignInEnabled())notFound();
 const client=await createSupabaseServerClient();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email_confirmed_at)notFound();
 const ids=(process.env.IMBHOLA_OPERATOR_USER_IDS??'').split(',').map(x=>x.trim()).filter(Boolean);
 if(!ids.includes(user.id))notFound();
 const {data:assurance,error:mfaError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
 if(mfaError||assurance?.currentLevel!=='aal2')notFound();
 return {user,client};
}
