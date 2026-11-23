import { demoHost, demoRuntimeEnabled } from '@/demo/config';
import Link from 'next/link';

export default function Brand() {
  return <Link className="wordmark" href={demoRuntimeEnabled() ? "https://"+demoHost : "/"} aria-label="Imbhola home">
    <span className="brand-mark" aria-hidden="true"><span/><span/><span/></span>
    <span>imbhola<span className="wordmark-dot">.</span></span>
  </Link>;
}
