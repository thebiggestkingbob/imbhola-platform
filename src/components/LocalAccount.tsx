import Link from 'next/link';
import LocalForm from './LocalForm';
import { Input, Select } from './LocalUI';

export default function LocalAccount({ register = false }: { register?: boolean }) {
  return <main className="container section">
    <p className="eyebrow">LOCAL DEVELOPMENT</p>
    <h1 className="inner-title">{register ? 'Request a synthetic account.' : 'Sign in to the local workspace.'}</h1>
    <p className="lead">Use synthetic @imbhola.test accounts and synthetic company information.</p>
    <LocalForm fields={{task:register ? 'register' : 'login'}} label={register ? 'Request account' : 'Sign in'}>
      {register && <>
        <Input name="name" label="Synthetic name"/>
        <Select name="kind" label="Account type" choices={[['employer','Employer team member'],['sdf','SDF']]}/>
      </>}
      <Input name="email" label="Email" type="email"/>
      <Input name="password" label="Password" type="password"/>
    </LocalForm>
    <Link className="text-link" href={register ? '/login' : '/signup'}>{register ? 'Sign in' : 'Request a synthetic account'}</Link>
  </main>;
}
