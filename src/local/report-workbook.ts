import writeXlsxFile, { type Cell } from 'write-excel-file/node';
import type { frozenReport } from './reporting.ts';

type Snapshot = NonNullable<ReturnType<typeof frozenReport>>;

function table(sheet: string, columns: string[], rows: Cell[][]) {
  return {
    sheet,
    columns: columns.map(title => ({ width: Math.max(20,title.length + 3) })),
    data: [columns.map(value => ({ value,fontWeight:'bold' as const,backgroundColor:'#E6EEE9' })), ...rows],
  };
}

export function reportWorkbook(snapshot: Snapshot, version: string) {
  const { report } = snapshot;
  const employeeNumber = new Map(report.employees.map(({id,data}) => [id,data.number]));
  const course = new Map(report.atr.map(({id,data}) => [id,data.course]));
  return writeXlsxFile([
    table('Summary',['Item','Value'],[
      ['Purpose','IMBHOLA internal review. Synthetic data. Do not submit to Services SETA.'],
      ['Company',String(report.company?.name ?? '')], ['SDL reference',String(report.company?.sdl ?? '')],
      ['ATR year',report.year], ['WSP year',report.year + 1], ['Version',version], ['Status',snapshot.status],
      ['Prepared by',snapshot.preparedName], ['Approved by',snapshot.approvedName], ['Signed by',snapshot.signedName],
      ['Signed on',String(snapshot.signedAt ?? '')], ['Rules',report.ruleVersion], ['Snapshot SHA-256',snapshot.digest],
      ['Planned training (ZAR)',report.totals.plannedCents / 100], ['Actual training (ZAR)',report.totals.actualCents / 100],
      ['Skills levies (ZAR)',report.totals.levyCents / 100],
    ]),
    table('WSP',['Employee number','Course','Planned date','Qualification','Budget (ZAR)'],report.wsp.map(({data}) => [
      employeeNumber.get(data.employee) ?? '',data.course,data.date,data.qualification,Number(data.cost),
    ])),
    table('ATR',['Employee number','Course','Training date','Provider','Attendance','Outcome','Qualification','Cost (ZAR)'],
      report.atr.map(({data}) => [employeeNumber.get(data.employee) ?? '',data.course,data.date,data.provider,
        data.attendance,data.outcome,data.qualification,Number(data.cost)])),
    table('Workforce',['Employee number','Job title','Department','Active'],report.employees.map(({data}) => [
      data.number,data.job,data.department,data.active,
    ])),
    table('OFO mappings',['Employee number','Code','Catalogue version','Title','Source','Override','Reason'],
      report.mappings.map(({data,catalogue}) => [employeeNumber.get(data.employee) ?? '',String(catalogue?.code ?? ''),
        String(catalogue?.version ?? ''),String(catalogue?.title ?? ''),String(catalogue?.source ?? ''),data.override,data.reason])),
    table('Skills gaps',['Employee number','Skill needed','Priority'],report.gaps.map(({data}) => [
      employeeNumber.get(data.employee) ?? '',data.skill,data.priority,
    ])),
    table('Evidence',['Type','Training activity','File','Uploaded','SHA-256'],report.evidence.map(file => [
      file.label,course.get(file.training_id) ?? '',file.filename,file.uploaded_at,file.digest,
    ])),
    table('Consultation',['Date','Attendees','Decision'],report.consultation.map(({data}) => [data.date,data.attendees,data.decision])),
    table('Checks',['Severity','Details'],[
      ...report.blockers.map(value => ['Blocker',value]), ...report.warnings.map(value => ['Warning',value]),
    ]),
  ]).toBuffer();
}
