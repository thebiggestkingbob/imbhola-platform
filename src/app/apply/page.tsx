import EmployerApplicationForm from '@/components/EmployerApplicationForm';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
export const dynamic='force-dynamic';
export default function Apply(){
 const enabled=isIdentitySignInEnabled()&&process.env.IMBHOLA_COMPANY_APPLICATIONS_ENABLED==='true';
 return <main className="container section">
  <div className="eyebrow">EMPLOYER ONBOARDING</div>
  <h1 className="inner-title">Register your interest.</h1>
  <p className="lead">A company must be independently verified before an authorised representative receives access.</p>
  {enabled?<EmployerApplicationForm/>:<p className="notice">Employer applications are not yet open. No company information is collected on this page.</p>}
 </main>;
}
