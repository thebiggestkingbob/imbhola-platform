import Link from 'next/link';

const links = [
  ['Platform', '/platform'],
  ['Solutions', '/solutions'],
  ['How it works', '/how-it-works'],
  ['About', '/about'],
  ['Contact', '/contact'],
] as const;

function NavLinks() {
  return <>{links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}</>;
}

export default function Header() {
  return <header className="site-header">
    <Link className="wordmark" href="/" aria-label="Imbhola home">IMBHOLA<span className="wordmark-dot">.</span></Link>
    <nav aria-label="Primary navigation" className="main-nav"><NavLinks /></nav>
    <div className="header-actions">
      <Link className="header-signin" href="/login">Sign in</Link>
      <Link className="button button-small" href="/request-demo">Explore Imbhola</Link>
    </div>
    <details className="mobile-nav">
      <summary aria-label="Toggle site navigation">Menu <span aria-hidden="true">☰</span></summary>
      <nav aria-label="Mobile navigation"><NavLinks /><Link href="/login">Sign in</Link><Link href="/request-demo">Explore Imbhola</Link></nav>
    </details>
  </header>;
}
