import Link from 'next/link';
import LeadForm from '@/components/LeadForm';
import { localWorkspaceEnabled } from '@/local/mode';

export default function Contact() {
  return <main className="container section">
    <div className="eyebrow">CONTACT</div>
    <h1 className="inner-title">Start a conversation.</h1>
    <p className="lead">Discuss skills development reporting, a future pilot or managed SDF support.</p>
    {localWorkspaceEnabled() ? <LeadForm purpose="enquiry"/> : <>
      <p className="notice">Contact requests will open after Imbhola confirms who handles enquiries and publishes its privacy information.</p>
      <Link className="text-link" href="/readiness">View launch readiness</Link>
    </>}
  </main>;
}
