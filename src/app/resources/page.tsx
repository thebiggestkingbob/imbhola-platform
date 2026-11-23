import Link from 'next/link';

export const metadata = { title: 'Resources' };

const answers = [
  ['What are WSP and ATR?', 'The Workplace Skills Plan explains which training an employer intends to deliver. The Annual Training Report records which training took place.'],
  ['What is an OFO mapping?', 'The Organising Framework for Occupations gives employers a common way to classify jobs. Review each proposed code against the duties of the job and record the reason for any override.'],
  ['What should employers keep throughout the year?', 'Keep an employee list, job classifications, planned and completed training, attendance, certificates, payments and committee records. Link documents to the relevant training record.'],
  ['Which SETA is first?', 'Services SETA is the first planned adapter. Imbhola will enable its official outputs after verifying the reporting-year rules and templates.'],
  ['Who submits the report?', 'An authorised person submits it through the external SETA process and records the receipt in Imbhola.'],
];

export default function Resources() {
  return <main className="container section">
    <div className="eyebrow">RESOURCES</div>
    <h1 className="inner-title">Skills development questions.</h1>
    <section className="workspace-panel" aria-label="Frequently asked questions">
      {answers.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
    <Link className="text-link" href="/how-it-works">See the reporting process</Link>
  </main>;
}
