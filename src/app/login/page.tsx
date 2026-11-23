import Link from 'next/link';
import LocalAccount from '@/components/LocalAccount';
import { demoPath, productionDemoEnabled } from '@/demo/config';
import { localWorkspaceEnabled } from '@/local/mode';

export default function Login() {
  if (localWorkspaceEnabled()) return <LocalAccount/>;
  if (productionDemoEnabled()) return <main className="container section">
    <div className="eyebrow">WORKSPACE ACCESS</div>
    <h1 className="inner-title">Choose a sample role.</h1>
    <p className="lead">Explore IMBHOLA with fictional company and employee records.</p>
    <a className="button" href={demoPath+'/login'}>Open workspace</a>
  </main>;
  return <main className="container section">
    <div className="eyebrow">ACCOUNT ACCESS</div>
    <h1 className="inner-title">Sign in to Imbhola.</h1>
    <p className="lead">Secure sign-in will be enabled once the identity provider, multi-tenant authorization and account recovery workflows are tested.</p>
    <p className="notice">Authentication is not active in this development foundation. No credentials are collected.</p>
    <Link className="text-link" href="/">Back to the website →</Link>
  </main>;
}
