import Link from 'next/link';
import LeadForm from '@/components/LeadForm';
import { localWorkspaceEnabled } from '@/local/mode';

export default function DemoRequest() {
  return <main className="container section account-layout">
    <div><div className="eyebrow">EXPERIENCE IMBHOLA</div>
    <h1 className="inner-title">Request a demo.</h1>
    <p className="lead">See how employers and SDFs prepare workforce, training and evidence records across a reporting cycle.</p>
    </div><section className="account-card"><h2>{localWorkspaceEnabled() ? 'Request a sample demo' : 'Availability'}</h2>
    {localWorkspaceEnabled() ? <LeadForm purpose="demo"/> : <>
      <p className="notice">Demo requests will open with the controlled pilot.</p>
      <Link className="text-link" href="/how-it-works">Explore the reporting workflow</Link>
    </>}</section>
  </main>;
}
