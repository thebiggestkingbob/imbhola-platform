import Link from 'next/link';

export const metadata = { title: 'Workspace access' };

export default function Access() {
  return (
    <main className="container section">
      <h1 className="inner-title">Workspace access is closed.</h1>
      <p className="lead">Employer, SDF and administrator accounts will open after verified sign-in and organisation permissions have been tested.</p>
      <Link className="button" href="/readiness">View launch readiness</Link>
    </main>
  );
}
