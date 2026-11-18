import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isIdentitySignInEnabled } from '@/lib/auth/flags';
import { signOutAction } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

const ROLE_NAMES: Record<string, string> = {
  company_admin: 'Company administrator', executive: 'Executive',
  hr_admin: 'HR administrator', training_admin: 'Training administrator',
  sdf: 'Skills development facilitator', line_manager: 'Line manager',
  committee_member: 'Committee member', signatory: 'Authorised signatory',
  employee: 'Employee / learner', auditor: 'Auditor',
};

export default async function Dashboard() {
  if (!isIdentitySignInEnabled()) {
    return <main className="container section">
      <div className="eyebrow">WORKSPACE PREVIEW</div>
      <h1 className="inner-title">Your workspace is being prepared.</h1>
      <p className="notice">Authentication is not active. No organisation or employee records are available.</p>
      <Link href="/" className="text-link">Return home →</Link>
    </main>;
  }

  const client = await createSupabaseServerClient();
  const { data: { user }, error: identityError } = await client.auth.getUser();
  if (identityError || !user?.email_confirmed_at) redirect('/login');

  // RLS enforces company membership; server also filters specifically to this user.
  const { data: memberships, error } = await client
    .from('organization_memberships')
    .select('organization_id, role, status, organizations(id, legal_name, display_name, verified_at)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  return <main className="container section">
    <div className="eyebrow">YOUR IMBHOLA WORKSPACE</div>
    <h1 className="inner-title">Your organisations.</h1>
    <p className="lead">Only organisations that have explicitly approved your membership appear here.</p>
    {error ? <p className="notice" role="alert">Your organisation access could not be loaded. Please try again later.</p> :
      !memberships?.length ? <p className="notice">Your identity is verified, but you have no active organisation memberships. An authorised administrator must invite and approve you before you can access company information.</p> :
      <div className="grid">
        {memberships.map((membership) => {
          const org = Array.isArray(membership.organizations)
            ? membership.organizations[0] : membership.organizations;
          if (!org?.verified_at) return null;
          return <article className="card" key={membership.organization_id + membership.role}>
            <span className="card-number">{ROLE_NAMES[membership.role] ?? 'Member'}</span>
            <h3>{org.display_name || org.legal_name}</h3>
            <p>Verified organisation. Detailed workflows are not yet available.</p>
          </article>;
        })}
      </div>
    }
    <form action={signOutAction}><button className="button" type="submit">Sign out</button></form>
  </main>;
}
