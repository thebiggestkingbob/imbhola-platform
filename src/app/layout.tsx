import type { Metadata } from 'next';
import Link from 'next/link';
import Brand from '@/components/Brand';
import Header from '@/components/Header';
import '@fontsource-variable/manrope';
import './globals.css';

export const metadata: Metadata = {
  title: {default:'Imbhola | Skills development, made clearer',template:'%s | Imbhola'},
  description:'Plan training, collect evidence and prepare skills development reports in one place.',
};

const footerGroups = [
  {label:'Product',links:[['Platform','/platform'],['How it works','/how-it-works'],['Pricing','/pricing'],['Resources','/resources']]},
  {label:'Imbhola',links:[['About','/about'],['Skills development','/skills-development'],['Request demo','/request-demo'],['Launch readiness','/readiness']]},
  {label:'Information',links:[['Privacy','/privacy'],['Terms','/terms'],['Accessibility','/accessibility']]},
];

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Header/>
    <div id="main-content" tabIndex={-1}>{children}</div>
    <footer className="footer">
      <div className="container footer-grid">
        <div><Brand/><p>Skills development, made clearer.</p></div>
        {footerGroups.map(({label,links}) => <nav aria-label={label} key={label}>
          <h2>{label}</h2>{links.map(([text,href]) => <Link key={href} href={href}>{text}</Link>)}
        </nav>)}
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Imbhola</span><span>Built for South African employers and SDFs.</span></div>
      </div>
    </footer>
  </body></html>;
}
