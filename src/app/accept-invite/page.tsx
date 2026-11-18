import AcceptInviteForm from '@/components/AcceptInviteForm';
import {isIdentitySignInEnabled} from '@/lib/auth/flags';
export const dynamic='force-dynamic';
export default function AcceptInvitePage(){
 const enabled=isIdentitySignInEnabled()&&process.env.IMBHOLA_INVITATIONS_ENABLED==='true';
 return <main className="container section">
  <div className="eyebrow">CONTROLLED TEAM ACCESS</div>
  <h1 className="inner-title">Join your organisation.</h1>
  {enabled?<AcceptInviteForm/>:<p className="notice">Invitation acceptance is not active in this environment.</p>}
 </main>;
}
