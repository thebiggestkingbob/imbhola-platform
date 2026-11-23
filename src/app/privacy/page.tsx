import Link from 'next/link';

export const metadata = { title: 'Preview privacy information' };

export default function Privacy() {
  return (
    <main className="container section">
      <h1 className="inner-title">Preview privacy information</h1>
      <p className="lead">The private review uses sample accounts and records. Use sample files and keep real company and employee information out of the preview and your feedback.</p>
      <p className="notice">Before collection opens, Imbhola will publish who handles personal information, why it is processed, retention rules and how people can exercise their rights.</p>
      <Link className="text-link" href="/readiness">View launch readiness</Link>
    </main>
  );
}
