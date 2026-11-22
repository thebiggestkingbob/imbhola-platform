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
    {review && !register && <p>Use the review passcode as your password. Sign in as <strong>owner@imbhola.test</strong> for the employer workspace, <strong>sdf@imbhola.test</strong> for the SDF workspace, or <strong>ops@imbhola.test</strong> for administration.</p>}
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
