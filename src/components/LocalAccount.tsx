import Link from 'next/link';
import { reviewWorkspaceEnabled } from '@/local/mode';
import LocalForm from './LocalForm';
import { Input, Select } from './LocalUI';

export default function LocalAccount({ register = false }: { register?: boolean }) {
  const review = reviewWorkspaceEnabled();
  const title = review ? 'Sign in to the review workspace.' : 'Sign in to the local workspace.';
  return <main className="container section">
    <p className="eyebrow">{review ? 'PRIVATE REVIEW' : 'LOCAL DEVELOPMENT'}</p>
    <h1 className="inner-title">{register ? 'Request a synthetic account.' : title}</h1>
    <p className="lead">Use synthetic @imbhola.test accounts and synthetic company information.</p>
    {review && !register && <details open>
      <summary>Test accounts and walkthrough</summary>
      <p>Use the review passcode as the password for every test account.</p>
      <ol>
        <li>Sign in as <strong>owner@imbhola.test</strong>. Open Atlas Workshop to test employees, OFO mappings, training and evidence.</li>
        <li>Use <strong>sdf@imbhola.test</strong> to move between client companies and prepare reports.</li>
        <li>Open Cedar Workshop as <strong>committee@imbhola.test</strong> to review the sample report. Use <strong>signatory@imbhola.test</strong> to sign it, then record a sample filing receipt as the SDF.</li>
        <li>Use <strong>ops@imbhola.test</strong> to review enquiries, companies, subscriptions, contracts and invoices.</li>
      </ol>
    </details>}
    <LocalForm fields={{task:register ? 'register' : 'login'}} label={register ? 'Request account' : 'Sign in'}>
      {register && <>
        <Input name="name" label="Synthetic name"/>
        <Select name="kind" label="Account type" choices={[[ 'employer','Employer team member'],['sdf','SDF']]}/>
      </>}
      <Input name="email" label="Email" type="email"/>
      <Input name="password" label="Password" type="password"/>
    </LocalForm>
    <Link className="text-link" href={register ? '/login' : '/signup'}>{register ? 'Sign in' : 'Request a synthetic account'}</Link>
  </main>;
}
