import Link from 'next/link';
import { BadgeCheck, FileText, GraduationCap, UsersRound, FolderOpen } from 'lucide-react';

export default function DashboardPreview() {
  return <figure className="social-preview" aria-label="Illustrative Imbhola workspace with sample data">
    <figcaption><strong>Your team. In the loop.</strong><span>Illustrative workspace</span></figcaption>
    <div className="social-preview-tabs"><strong>Team space</strong><span>Training</span><span>Evidence</span></div>
    <div className="people-strip">{[['HR','Your people'],['SD','Your SDF'],['TR','Training'],['RC','Review']].map(([initials,label]) => <div key={label}><span className="profile-circle">{initials}</span><small>{label}</small></div>)}</div>
    <article className="feed-card">
      <header className="feed-person"><span className="profile-circle">CW</span><div><strong>Cedar Workshop <BadgeCheck size={16} aria-label="Sample company"/></strong><small>Team space · Sample training update</small></div></header>
      <p>Small steps. Real progress.<br/>Bring your people, their training and the evidence together.</p>
      {/* Owned project photography; this is explicitly illustrative, not a live activity stream. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/skills-workshop.webp" alt="People taking part in a practical skills workshop" width="1200" height="800"/>
      <footer><span><GraduationCap size={17}/> Training</span><span><FolderOpen size={17}/> Supporting evidence</span></footer>
    </article>
    <Link className="feed-shortcut" href="/platform"><span className="icon-tile"><FileText size={21}/></span><span><strong>Keep everyone moving together</strong><small>Explore the Imbhola workflow</small></span></Link>
    <div className="preview-social-nav" aria-hidden="true"><UsersRound size={21}/><GraduationCap size={21}/><span>+</span><FolderOpen size={21}/><FileText size={21}/></div>
  </figure>;
}
