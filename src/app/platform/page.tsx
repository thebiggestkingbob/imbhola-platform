import { ClipboardCheck, FileText, FolderOpen, GraduationCap, ListChecks, UsersRound } from 'lucide-react';
import { PublicCard, PublicPage } from '@/components/PublicPage';

const capabilities = [
  [UsersRound,'Workforce','Import employee records, review duplicates and map occupations.'],
  [GraduationCap,'Training','Plan learning around skills gaps and record attendance, costs and outcomes.'],
  [FolderOpen,'Evidence','Attach certificates, attendance or payments to the relevant training records.'],
  [FileText,'Reporting','Prepare WSP and ATR figures, work through blockers and review the totals.'],
  [ClipboardCheck,'Approvals','Give committees and signatories a version to review and keep its history.'],
  [ListChecks,'Filing history','Record external receipts, corrections and decisions against the relevant version.'],
] as const;

export default function Platform() {
  return <PublicPage eyebrow="The platform" title="From workforce records to a report you can review."
    description="Keep the records, decisions and documents for each reporting year together."
    cta={{label:'Talk to us',href:'/contact'}}>
    <div className="grid">{capabilities.map(([Icon,title,body]) =>
      <PublicCard key={title} title={title} icon={<Icon size={23} aria-hidden="true"/>}><p>{body}</p></PublicCard>)}</div>
    <p className="notice">Official Services SETA validation and exports require independently verified rules and templates.</p>
  </PublicPage>;
}
