import LocalForm from './LocalForm';
import { Input } from './LocalUI';

export default function LeadForm({ purpose }: { purpose: 'enquiry' | 'demo' }) {
  return <>
    <p>In local development, Imbhola uses this synthetic contact information to review the request in its operations workspace.</p>
    <LocalForm fields={{task:'lead',purpose}} label={purpose === 'demo' ? 'Request a demo' : 'Send enquiry'}>
      <Input name="name" label="Synthetic name"/>
      <Input name="email" label="Synthetic email (@imbhola.test)" type="email"/>
      <Input name="company" label="Synthetic company"/>
      <label className="check-field"><input type="checkbox" name="consent" required/> I consent to storing this synthetic enquiry for local review.</label>
    </LocalForm>
  </>;
}
