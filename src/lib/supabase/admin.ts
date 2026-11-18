import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getPublicSupabaseConfig} from './config';

/** Administrative client is server-only. Never import into any client component. */
export function createSupabaseAdminClient(){
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw new Error('Imbhola administrative Supabase key is not configured.');
 const {url}=getPublicSupabaseConfig();
 return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
