import {NextRequest,NextResponse} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const loginUrl=new URL('/login',request.url);
 if(!isIdentitySignInEnabled())return NextResponse.redirect(loginUrl);
 const code=request.nextUrl.searchParams.get('code');
 const tokenHash=request.nextUrl.searchParams.get('token_hash');
 const type=request.nextUrl.searchParams.get('type');
 const flow=request.nextUrl.searchParams.get('flow');
 const client=await createSupabaseServerClient();
 let success=false;
 if(code){
  const {error}=await client.auth.exchangeCodeForSession(code);
  success=!error;
 }else if(tokenHash && (type==='email'||type==='recovery')){
  const {error}=await client.auth.verifyOtp({token_hash:tokenHash,type});
  success=!error;
 }
 if(!success)return NextResponse.redirect(new URL('/login?verification=invalid',request.url));
 const next=flow==='recovery'?'/reset-password':'/dashboard';
 return NextResponse.redirect(new URL(next,request.url));
}
