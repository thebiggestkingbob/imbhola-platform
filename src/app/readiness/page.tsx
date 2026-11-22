import Link from 'next/link';

export const metadata = { title: 'Launch readiness' };

const stages = [
  ['Public website', 'Informational preview', 'Explore the planned platform and service options.'],
  ['Secure accounts', 'Pending verification', 'The pilot requires verified identity, MFA and organisation permissions.'],
  ['Workforce and training', 'Pilot pending', 'Workforce imports and employee records are unavailable in this preview.'],
  ['Services SETA reporting', 'Pending validation', 'Official templates and reporting-year rules must be confirmed before exports can be enabled.'],
  ['Managed reporting', 'Planned', 'Service agreements, consultant appointments and service levels are pending.'],
];

export default function Readiness() {
  return (
    <main className="container section">
      <h1 className="inner-title">Launch readiness</h1>
      <div className="grid">
        {stages.map(([title, status, description]) => (
          <article className="card" key={title}>
            <span className="card-number">{status}</span>
            <h2 className="card-title">{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <Link className="text-link" href="/privacy">Read the preview privacy information</Link>
    </main>
  );
}
