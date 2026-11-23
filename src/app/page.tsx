import Link from 'next/link';
import { BookOpen, CheckCircle2, ClipboardCheck, FileCheck2, GraduationCap, UsersRound } from 'lucide-react';
import DashboardPreview from '@/components/DashboardPreview';

const pillars = [
  {Icon:UsersRound,title:'Understand your workforce',body:'Bring employee records, occupation codes and skills gaps together.'},
  {Icon:GraduationCap,title:'Manage training',body:'Plan the year ahead, record completed training and attach supporting evidence.'},
  {Icon:FileCheck2,title:'Prepare for review',body:'Check your WSP and ATR, record approvals and keep a history of each version.'},
];

export default function Home() {
  return <main>
    <section className="container hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-dot"/>People. Skills. Progress.</p>
        <h1>Your people.<br/>Their growth.<br/><em>One shared space.</em></h1>
        <p className="lead">Keep your team, training and skills development connected. A shared space for employers and SDFs to move forward together.</p>
        <div className="actions"><Link className="button" href="/request-demo">Request a demo</Link><Link className="button button-secondary" href="/how-it-works">See how it works</Link></div>
      </div>
      <DashboardPreview/>
    </section>
    <section className="soft-section">
      <div className="container section">
        <p className="eyebrow">The workflow</p><h2>Stay connected to what matters.</h2>
        <div className="grid">{pillars.map(({Icon,title,body}) => <article className="card" key={title}>
          <div className="icon-tile"><Icon size={24} aria-hidden="true"/></div><h3>{title}</h3><p>{body}</p>
        </article>)}</div>
      </div>
    </section>
    <section className="container section audience-section">
      <div>
        <p className="eyebrow">Made for your team</p><h2>Everyone has a part to play.</h2>
        <p className="lead">Give HR teams, SDFs and signatories a shared view of each reporting cycle, with access based on their role.</p>
        <Link className="button button-secondary" href="/solutions">Explore team roles</Link>
      </div>
      <div className="audience-list">
        <p><UsersRound aria-hidden="true"/>Employer and HR teams</p>
        <p><BookOpen aria-hidden="true"/>Skills development facilitators</p>
        <p><ClipboardCheck aria-hidden="true"/>Committees and signatories</p>
        <p><CheckCircle2 aria-hidden="true"/>Imbhola operations</p>
      </div>
    </section>
  </main>;
}
