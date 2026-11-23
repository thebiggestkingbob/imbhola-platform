import Link from 'next/link';

export const metadata = { title: 'Services' };

const services = [
  ['Self-service software', 'Organise workforce information, training plans and evidence throughout the reporting year.'],
  ['Managed support', 'Work with a specialist on agreed tasks such as organising records and preparing materials for review.'],
  ['SDF consultancy', 'Coordinate reporting preparation for employers who have authorised you to act on their behalf.'],
];

export default function Services() {
  return (
    <main className="container section">
      <h1 className="inner-title">Software and specialist support</h1>
      <p className="lead">Imbhola is developing a self-service platform with optional managed skills development support.</p>
      <div className="grid">
        {services.map(([title, description]) => (
          <article className="card" key={title}>
            <h2 className="card-title">{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <p className="notice">Managed services are planned. Pricing, scope and service levels will be agreed before onboarding.</p>
      <Link className="button" href="/readiness">View launch readiness</Link>
    </main>
  );
}
