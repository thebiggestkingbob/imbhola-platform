import Link from 'next/link';

export const metadata = { title: 'How it works' };

const steps = [
  ['Set up company access', 'Confirm your company information, invite your team and set the end date for any SDF appointment.'],
  ['Organise workforce records', 'Review CSV imports, resolve duplicates and map jobs to an occupational code with a recorded source and reason.'],
  ['Plan training and record outcomes', 'Use skills gaps to budget the WSP. Record actual training, providers, attendance, costs and qualification details for the ATR.'],
  ['Collect evidence', 'Link attendance, certificates and payment records to the relevant training and record the committee consultation.'],
  ['Review and sign', 'Resolve blockers, read warnings and have separate people review and sign a frozen version of the report.'],
  ['Track the filing outcome', 'Once approved Services SETA outputs are available, an authorised person files externally and records the receipt, corrections and decisions.'],
];

export default function HowItWorks() {
  return <main className="container section">
    <div className="eyebrow">HOW IMBHOLA WORKS</div>
    <h1 className="inner-title">A reporting cycle you can follow.</h1>
    <div className="grid">
      {steps.map(([title,description]) => <article className="card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
    </div>
    <Link className="button" href="/request-demo">Request a demo</Link>
  </main>;
}
