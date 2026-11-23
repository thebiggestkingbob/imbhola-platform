import { Building2, ClipboardCheck, FolderCog, GraduationCap, UsersRound } from 'lucide-react';
import { PublicCard, PublicPage } from '@/components/PublicPage';

const roles = [
  [Building2,'Employers and executives','See each company’s reporting readiness, priorities and pending decisions.'],
  [UsersRound,'HR and training teams','Manage workforce records, skills gaps, training plans and supporting evidence.'],
  [GraduationCap,'Skills development facilitators','Coordinate reporting across companies that have appointed you.'],
  [ClipboardCheck,'Committees and signatories','Review consultation records and act on a specific, saved report version.'],
  [FolderCog,'Imbhola operations','Manage workspaces, client support, reporting references and commercial records.'],
] as const;

export default function Solutions() {
  return <PublicPage eyebrow="Who it serves" title="The right work for each role."
    description="Every team has different responsibilities. Imbhola keeps them connected to the same reporting cycle."
    cta={{label:'Discuss your team’s needs',href:'/contact'}}>
    <div className="grid">{roles.map(([Icon,title,body]) =>
      <PublicCard key={title} title={title} icon={<Icon size={23} aria-hidden="true"/>}><p>{body}</p></PublicCard>)}</div>
  </PublicPage>;
}
