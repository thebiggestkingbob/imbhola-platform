import Link from 'next/link';

const journey = [
  {step:'01',heading:'Organise your people.',body:'Bring workforce information, occupations and development needs into one structured picture.'},
  {step:'02',heading:'Make training accountable.',body:'Connect activities to the people responsible, participants, attendance and supporting evidence.'},
  {step:'03',heading:'Prepare with clarity.',body:'Review WSP/ATR working information and approvals. Official SETA exports remain unavailable until verified.'},
];
const workspaces = [
  ['Employers', 'A clearer view of reporting readiness and decisions.'],
  ['HR & training teams', 'One place to coordinate workforce and training records.'],
  ['Skills development facilitators', 'Permission-bound workspaces across authorised clients.'],
  ['Employees & managers', 'Personal learning records, requests and the actions that matter.'],
];
export default function Home() {
  return <main>
    <section className="hero container" aria-labelledby="home-title">
      <div className="eyebrow">SKILLS DEVELOPMENT · SOUTH AFRICA</div>
      <h1 id="home-title">Your skills levy.<br/><em>Put to work.</em></h1>
      <p className="lead">Bring workforce information, training plans, supporting evidence and reporting preparation into one considered workspace.</p>
      <div className="actions">
        <Link className="button" href="/platform">Explore the platform <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" href="/how-it-works">See how it works →</Link>
      </div>
      <div className="hero-meta"><span>Purpose-built for employers &amp; SDFs</span><span>Clarity, from plan to evidence</span></div>
    </section>
    <section className="cream-section" aria-labelledby="journey-title">
      <div className="container section">
        <div className="eyebrow">ONE PLACE. MORE CLARITY.</div>
        <h2 id="journey-title">From workforce information<br/>to reporting readiness.</h2>
        <div className="grid">
          {journey.map(({step,heading,body})=><article className="card" key={step}><span className="card-number">{step} /</span><h3>{heading}</h3><p>{body}</p></article>)}
        </div>
        <Link className="text-link" href="/how-it-works">Explore the journey →</Link>
      </div>
    </section>
    <section className="container section" aria-labelledby="roles-title">
      <div className="eyebrow">BUILT FOR REAL TEAMS</div>
      <h2 id="roles-title">One connected platform.<br/>Different responsibilities.</h2>
      <p className="lead">Each team member can see work relevant to their role, with access controlled by organisation permissions.</p>
      <div className="roles-grid">{workspaces.map(([name,description])=><article className="role-tile" key={name}><h3>{name}</h3><p>{description}</p></article>)}</div>
      <Link className="text-link" href="/solutions">Explore solutions →</Link>
    </section>
    <section className="cream-section" aria-labelledby="readiness-title">
      <div className="container section">
        <div className="eyebrow">BUILT WITH CARE</div>
        <h2 id="readiness-title">Reporting is a process.<br/><em>Not just a deadline.</em></h2>
        <p className="lead">Imbhola is being developed around accountable workflows, document evidence and reviewable decisions—not promises of automatic SETA approval or grant funding.</p>
        <div className="actions"><Link href="/skills-development" className="button">Understand skills development</Link><Link href="/request-demo" className="text-link">Future demonstrations →</Link></div>
        <p className="development-note">Product development preview. Company registrations and official SETA exports are not currently active.</p>
      </div>
    </section>
  </main>;
}
