import Link from 'next/link';
const SECTIONS = [
  ['Overview',''], ['Workforce','workforce'], ['Training catalogue','training'],
  ['Training events','training-events'], ['WSP plans','wsp'], ['ATR records','atr'],
  ['Evidence','evidence'], ['Approvals','approvals'], ['Grants','grants'],
  ['Tasks','tasks'], ['Reporting years','reporting']
] as const;
export default function WorkspaceNav({ organizationId }: { organizationId: string }) {
  const base = '/workspace/' + organizationId;
  return <nav className="workspace-navigation" aria-label="Organisation workspace">
    {SECTIONS.map(([label,slug]) =>
      <Link key={slug} href={slug ? base + '/' + slug : base}>{label}</Link>
    )}
  </nav>;
}
