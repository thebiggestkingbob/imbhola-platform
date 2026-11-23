import { localWorkspaceEnabled } from '@/local/mode';
import Link from 'next/link';
import { reviewSandboxName } from '@/local/review-launcher';
import { PublicPage } from '@/components/PublicPage';

export const metadata = { title: 'Workspace access' };

export default function Access() {
  const enabled = localWorkspaceEnabled();
  const preview = Boolean(reviewSandboxName());
  return <PublicPage eyebrow="Workspace access"
    title={enabled ? 'Open your workspace.' : preview ? 'Open the private review.' : 'Workspace access will open with the pilot.'}
    description={enabled ? 'Choose an employer, SDF or administrator account to work with sample records.' :
      preview ? 'Use the review passcode to explore the public site and workspaces together with sample data.' :
      'The pilot requires verified sign-in and company permissions before real records can be added.'}>
    <section className="account-card access-card">
      <h2>{enabled ? 'Sample workspace' : preview ? 'Private review' : 'Launch readiness'}</h2>
      <Link className="button" href={enabled ? '/dashboard' : preview ? '/private-review' : '/readiness'}>
        {enabled ? 'Open workspace' : preview ? 'Enter private review' : 'View launch readiness'}
      </Link>
    </section>
  </PublicPage>;
}
