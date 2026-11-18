import 'server-only';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isIdentitySignInEnabled } from '@/lib/auth/flags';

const ADMINISTRATIVE_ROLES = new Set([
  'company_admin','executive','hr_admin','training_admin','sdf','signatory','auditor'
]);

export async function requireOrgWorkspace(organizationId: string) {
  if (!isIdentitySignInEnabled()) notFound();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)) notFound();
  const client = await createSupabaseServerClient();
  const { data: { user }, error: identityError } = await client.auth.getUser();
  if (identityError || !user?.email_confirmed_at) redirect('/login');

  const { data: members, error: membershipError } = await client
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (membershipError || !members?.length) notFound();

  const { data: organization } = await client
    .from('organizations')
    .select('id, legal_name, display_name, verified_at')
    .eq('id', organizationId)
    .not('verified_at', 'is', null)
    .maybeSingle();
  if (!organization) notFound();

  const roles = members.map(m => m.role);
  if (roles.some(r => ADMINISTRATIVE_ROLES.has(r))) {
    const { data: assurance, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || assurance?.currentLevel !== 'aal2') {
      redirect('/dashboard?verification=required');
    }
  }
  return { client, user, organization, roles };
}
