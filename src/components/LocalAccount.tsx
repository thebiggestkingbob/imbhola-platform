import { demoHost, demoRuntimeEnabled } from '@/demo/config';
import Link from 'next/link';
import { reviewWorkspaceEnabled } from '@/local/mode';
import { reviewAccounts } from '@/local/review-gate';
import Brand from './Brand';
import LocalForm from './LocalForm';
import { Input, Select } from './LocalUI';

export default function LocalAccount({ register = false }: { register?: boolean }) {
  const demo = demoRuntimeEnabled();
  const review = reviewWorkspaceEnabled();
  const title = demo ? 'Choose your workspace role.' : review ? 'Sign in to the review workspace.' : 'Sign in to the local workspace.';
  return <main className="container section account-layout"><div>
    {demo && <Brand/>}
    <p className="eyebrow">{demo ? 'SAMPLE WORKSPACE' : review ? 'PRIVATE REVIEW' : 'LOCAL DEVELOPMENT'}</p>
    <h1 className="inner-title">{register ? 'Request a synthetic account.' : title}</h1>
    <p className="lead">{demo ? 'Explore IMBHOLA with sample data. Your changes stay in this browser’s workspace for 24 hours. Use fictional people, companies and documents.' : 'Use sample accounts and company information during this review.'}</p></div><div className="account-card">
    {(demo || review) && !register && <LocalForm fields={{task:demo ? 'demoLogin' : 'reviewLogin'}} label="Open workspace">
      <Select name="account" label="Choose a test role" choices={reviewAccounts}/>
    </LocalForm>}
    {(demo || review) && !register && <details>
      <summary>Test accounts and walkthrough</summary>
      <p>Choose any role to use its sample account. Sign out to switch roles.</p>
      <ol>
        <li>Sign in as <strong>owner@imbhola.test</strong>. Open Atlas Workshop to test employees, OFO mappings, training and evidence.</li>
        <li>Use <strong>sdf@imbhola.test</strong> to move between client companies and prepare reports.</li>
        <li>Open Cedar Workshop as <strong>committee@imbhola.test</strong> to review the sample report. Use <strong>signatory@imbhola.test</strong> to sign it, then record a sample filing receipt as the SDF.</li>
        <li>Use <strong>ops@imbhola.test</strong> to review enquiries, companies, subscriptions, contracts and invoices.</li>
      </ol>
    </details>}
    {review && !demo && !register && <details><summary>Sign in with another account</summary>
      <LocalForm fields={{task:'login'}} label="Sign in"><Input name="email" label="Email" type="email"/><Input name="password" label="Password" type="password"/></LocalForm>
    </details>}
    {!demo && (!review || register) && <LocalForm fields={{task:register ? 'register' : 'login'}} label={register ? 'Request account' : 'Sign in'}>
      {register && <>
        <Input name="name" label="Synthetic name"/>
        <Select name="kind" label="Account type" choices={[[ 'employer','Employer team member'],['sdf','SDF']]}/>
      </>}
      <Input name="email" label="Email" type="email"/>
      <Input name="password" label="Password" type="password"/>
    </LocalForm>}
    {demo ? <a className="text-link" href={"https://"+demoHost+"/access"}>Back to workspace access</a> : <Link className="text-link" href={register ? '/login' : '/signup'}>{register ? 'Sign in' : 'Request a synthetic account'}</Link>}
  </div></main>;
}
