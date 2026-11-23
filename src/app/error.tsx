'use client';

import Link from 'next/link';

export default function ErrorPage({reset}:{reset:()=>void}) {
  return <main className="container section account-layout">
    <div><p className="eyebrow">Page error</p><h1>We couldn’t open this page.</h1><p className="lead">Try again or return to the homepage.</p></div>
    <div className="account-card"><div className="actions"><button type="button" className="button" onClick={reset}>Try again</button><Link className="button button-secondary" href="/">Back to home</Link></div></div>
  </main>;
}
