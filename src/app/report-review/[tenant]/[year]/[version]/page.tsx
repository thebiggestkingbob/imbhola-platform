import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Table, rand } from '@/components/LocalUI';
import PrintReport from '@/components/PrintReport';
import { localDb } from '@/local/db';
import { frozenReport } from '@/local/reporting';
import { requireActor } from '@/local/session';

export default async function ReportReview({ params }: {params:Promise<{tenant:string;year:string;version:string}>}) {
  const actor = await requireActor();
  const {tenant,year,version} = await params;
  const frozen = frozenReport(localDb(),actor,tenant,year,version);
  if (!frozen) notFound();
  const {report} = frozen;
  const people = new Map(report.employees.map(({id,data}) => [id,data.number]));
  const mappings = new Map(report.mappings.map(({data,catalogue}) => [data.employee,catalogue]));
  return <main className="container workspace report-review">
    <nav className="workspace-top" aria-label="Report actions">
      <Link className="text-link" href={'/workspace/'+tenant+'?tab=reports&year='+year}>Back to reporting</Link>
      <PrintReport/>
    </nav>
    <p className="eyebrow">Internal synthetic report · Official Services SETA export disabled</p>
    <h1>WSP and ATR review</h1>
    <p className="lead">{String(report.company?.name ?? tenant)} · ATR {report.year} · WSP {report.year + 1} · Version {version}</p>
    <dl className="workspace-metrics">
      <div><dt>Status</dt><dd>{frozen.status}</dd></div>
      <div><dt>Planned training budget</dt><dd>{rand.format(report.totals.plannedCents / 100)}</dd></div>
      <div><dt>Actual training costs</dt><dd>{rand.format(report.totals.actualCents / 100)}</dd></div>
      <div><dt>Skills levies</dt><dd>{rand.format(report.totals.levyCents / 100)}</dd></div>
    </dl>
    <section className="workspace-panel">
      <h2>Planned training</h2>
      <Table columns={['Employee','Course','Date','Qualification','Budget']} rows={report.wsp.map(({data}) =>
        [people.get(data.employee),data.course,data.date,data.qualification,rand.format(Number(data.cost))])}/>
    </section>
    <section className="workspace-panel">
      <h2>Actual training</h2>
      <Table columns={['Employee','Course','Date','Provider','Attendance','Outcome','Cost']} rows={report.atr.map(({data}) =>
        [people.get(data.employee),data.course,data.date,data.provider,data.attendance,data.outcome,rand.format(Number(data.cost))])}/>
    </section>
    <section className="workspace-panel">
      <h2>Workforce and skills gaps</h2>
      <Table columns={['Employee','Job','OFO code','Catalogue source','Skills gaps']} rows={report.employees.map(({id,data}) => {
        const mapping = mappings.get(id);
        return [data.number,data.job,String(mapping?.code ?? '—'),
          String(mapping?.source ?? '—'),report.gaps.filter(gap => gap.data.employee === id).map(gap => gap.data.skill).join(', ')];
      })}/>
    </section>
    <section className="workspace-panel">
      <h2>Evidence and consultation</h2>
      <Table columns={['Evidence type','Filename','Training','Uploaded']} rows={report.evidence.map(file=>[
        file.label,file.filename,report.atr.find(({id})=>id === file.training_id)?.data.course,file.uploaded_at.slice(0,10),
      ])}/>
      <Table columns={['Committee date','Attendees','Decision']} rows={report.consultation.map(({data}) =>
        [data.date,data.attendees,data.decision])}/>
    </section>
    <section className="workspace-panel">
      <h2>Review record</h2>
      <Table columns={['Prepared by','Approved by','Signed by','Signed on']} rows={[
        [frozen.preparedName,frozen.approvedName ?? '—',frozen.signedName ?? '—',String(frozen.signedAt ?? '—').slice(0,10)],
      ]}/>
      <Table columns={['Severity','Check']} rows={[
        ...report.blockers.map(item => ['Blocker',item]),...report.warnings.map(item => ['Warning',item]),
        ...(!report.blockers.length && !report.warnings.length ? [['Ready','Internal checks passed']] : []),
      ]}/>
      <p className="report-digest">Rules {report.ruleVersion} · Snapshot SHA-256 {frozen.digest}</p>
    </section>
  </main>;
}
