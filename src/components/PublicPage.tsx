import Link from 'next/link';
import type { ReactNode } from 'react';

export function PublicPage({eyebrow,title,description,children,cta}:{
  eyebrow:string;title:string;description?:string;children?:ReactNode;cta?:{label:string;href:string};
}) {
  return <main className="container section public-page">
    <header className="public-intro"><p className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</p>
      <h1 className="inner-title">{title}</h1>{description && <p className="lead">{description}</p>}
    </header>
    {children}
    {cta && <div className="actions"><Link className="button" href={cta.href}>{cta.label}</Link></div>}
  </main>;
}

export function PublicCard({title,children,icon}:{title:string;children:ReactNode;icon?:ReactNode}) {
  return <article className="card">{icon && <div className="icon-tile">{icon}</div>}<h2 className="card-title">{title}</h2>{children}</article>;
}
