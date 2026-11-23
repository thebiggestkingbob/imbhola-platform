import Link from 'next/link';
const links=[['Platform','/platform'],['Solutions','/solutions'],['Services','/services'],['Contact','/contact']];
export default function Header(){return <header className="site-header"><Link className="wordmark" href="/" aria-label="Imbhola home">IMBHOLA<span className="wordmark-dot">.</span></Link><nav aria-label="Primary navigation" className="main-nav">{links.map(([name,url])=><Link key={url} href={url}>{name}</Link>)}</nav><div className="header-actions"><Link className="button button-small" href="/access">Workspace access</Link></div></header>}
