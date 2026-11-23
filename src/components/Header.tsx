'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Brand from './Brand';

const links = [
  ['Platform','/platform'], ['How it works','/how-it-works'], ['Solutions','/solutions'], ['Services','/services'], ['Contact','/contact'],
] as const;

export default function Header() {
  const pathname = usePathname();
  return <header className="site-header">
    <div className="container header-inner">
      <Brand/>
      <nav aria-label="Primary navigation" className="main-nav">
        {links.map(([label,href]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <Link className="button button-small" href="/access">Workspace access</Link>
        <details className="mobile-site-menu" key={pathname}>
          <summary aria-label="Website menu"><Menu size={21} aria-hidden="true"/></summary>
          <nav aria-label="Mobile website navigation">
            {links.map(([label,href]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}
            <Link href="/pricing">Pricing</Link>
          </nav>
        </details>
      </div>
    </div>
  </header>;
}
