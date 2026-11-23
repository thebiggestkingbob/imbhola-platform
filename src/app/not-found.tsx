import Link from 'next/link';
import { Search } from 'lucide-react';

export default function NotFound() {
  return <main className="container section account-layout">
    <div><p className="eyebrow">Page unavailable</p><h1>This page is out of reach.</h1>
      <p className="lead">Check the address, or open your workspace to find the pages you can access.</p></div>
    <div className="account-card"><div className="icon-tile"><Search aria-hidden="true"/></div>
      <div className="actions"><Link className="button" href="/access">Workspace access</Link><Link className="button button-secondary" href="/">Back to home</Link></div>
    </div>
  </main>;
}
