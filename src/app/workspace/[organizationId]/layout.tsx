import type { ReactNode } from 'react';
import Link from 'next/link';
import WorkspaceNav from '@/components/WorkspaceNav';
import { requireOrgWorkspace } from '@/lib/workspace/access';

export const dynamic = 'force-dynamic';

export default async function OrganizationLayout({
  children, params,
}: { children: ReactNode; params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { organization, roles } = await requireOrgWorkspace(organizationId);
  return <main className="container section">
    <div className="eyebrow">IMBHOLA / SECURE WORKSPACE</div>
    <p className="workspace-back"><Link href="/dashboard">← All organisations</Link></p>
    <h1 className="workspace-title">{organization.display_name || organization.legal_name}</h1>
    <p className="workspace-caption">Verified organisation · {roles.join(' · ').replaceAll('_',' ')}</p>
    <WorkspaceNav organizationId={organizationId} roles={roles}/>
    {children}
  </main>;
}
