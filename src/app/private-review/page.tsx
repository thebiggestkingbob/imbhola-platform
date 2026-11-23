import { notFound } from 'next/navigation';
import { reviewLauncherPassword } from '@/local/review-launcher';

export const metadata = { title: 'IMBHOLA private review', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PrivateReview({ searchParams }: { searchParams: Promise<{status?:string}> }) {
  if (!reviewLauncherPassword()) notFound();
  const {status} = await searchParams;
  return <main className="container section account-layout">
    <div><p className="eyebrow">PRIVATE TEST ENVIRONMENT</p>
    <h1 className="inner-title">Open the IMBHOLA workspaces.</h1>
    <p className="lead">Use this link whenever you return to test. Opening a session may take a moment. Your sample records are saved between sessions.</p></div>
    <div className="account-card"><h2>Review access</h2>
    <form className="workspace-form" method="post" action="/api/private-review">
      <label>Review passcode<input name="passcode" type="password" autoComplete="off" required maxLength={128}/></label>
      {status === 'invalid' && <p className="form-error" role="alert">The review passcode is incorrect.</p>}
      {status === 'waiting' && <p className="form-error" role="alert">The workspace is still starting or saving the previous session. Try again in a moment.</p>}
      <div><button className="button">Open private workspace</button></div>
    </form></div>
  </main>;
}
