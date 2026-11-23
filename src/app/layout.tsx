import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Imbhola | Skills development, made clearer', template: '%s | Imbhola' },
  description: 'A considered workspace for skills development planning, training evidence and reporting readiness.'
};
const footerLinks = [
  ['Launch readiness', '/readiness'], ['About', '/about'], ['How it works', '/how-it-works'], ['Skills development', '/skills-development'],
  ['Pricing', '/pricing'], ['Resources', '/resources'], ['Request demo', '/request-demo'],
  ['Privacy', '/privacy'], ['Terms', '/terms'], ['Accessibility', '/accessibility']
] as const;
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>
    <Header/>
    {children}
    <footer className="footer">
      <div><strong>IMBHOLA.</strong><p>Skills development, made clearer.</p><p>Platform in development. Official SETA exports disabled.</p></div>
      <nav aria-label="Footer navigation" style={{display:'flex',flexWrap:'wrap',gap:'14px 22px',maxWidth:660}}>
        {footerLinks.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}
      </nav>
      <span>© {new Date().getFullYear()} Imbhola</span>
    </footer>
  </body></html>
}
