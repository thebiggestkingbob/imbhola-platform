import { localWorkspaceEnabled } from '@/local/mode';
import Link from 'next/link';

export const metadata = { title: 'Workspace access' };

export default function Access() {
  const enabled = localWorkspaceEnabled();
  return (
    <main className="container section">
      <h1 className="inner-title">{enabled ? 'Open your workspace.' : 'Workspace access is closed.'}</h1>
      <p className="lead">{enabled ? 'Sign in with a sample employer, SDF or administrator account.' : 'Employer, SDF and administrator accounts will open after verified sign-in and organisation permissions have been tested.'}</p>
      {enabled ? <Link className="button" href="/dashboard">Open workspace</Link> : <Link className="button" href="/readiness">View launch readiness</Link>}
    </main>
  );
}
