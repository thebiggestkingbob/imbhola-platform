import Link from 'next/link';

export const metadata = { title: 'Pricing' };

export default function Pricing() {
  return <main className="container section">
    <div className="eyebrow">SOFTWARE AND MANAGED SERVICES</div>
    <h1 className="inner-title">Choose the support your team needs.</h1>
    <div className="grid plan-grid">
      <article className="card"><h3>Software subscription</h3><p>Your team manages workforce records, training, evidence and approvals in Imbhola. Appoint an SDF where you need one.</p></article>
      <article className="card"><h3>Optional managed service</h3><p>Arrange a separate scope for SDF support or reporting preparation. The employer keeps oversight and sign-off.</p></article>
    </div>
    <p className="notice">Subscription prices and managed service terms are being finalised.</p>
    <Link className="button" href="/contact">Discuss your requirements</Link>
  </main>;
}
