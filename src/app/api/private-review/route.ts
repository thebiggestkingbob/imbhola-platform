import { Sandbox } from '@vercel/sandbox';
import { setTimeout } from 'node:timers/promises';
import { createReviewInvitation, hasReviewInvitation } from '@/local/review-gate';
import { canOpenProtectedReview, reviewLauncherPassword, reviewPasscodeMatches, reviewSandboxName } from '@/local/review-launcher';

export const runtime = 'nodejs';
export const maxDuration = 60;

const port = 3000;
const retention = 30 * 24 * 60 * 60 * 1000;
const headers = {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};

function sendTo(location: string) {
  return new Response(null,{status:303,headers:{...headers,Location:location}});
}

async function ready(url: URL) {
  try {
    const response = await fetch(url,{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(1500)});
    return response.ok && (await response.text()).includes('Private workspace review');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const password = reviewLauncherPassword();
  const name = reviewSandboxName();
  if (!password || !name) return new Response(null,{status:404,headers});
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  if (!host || origin !== 'https://' + host ||
      request.headers.get('content-type')?.split(';',1)[0] !== 'application/x-www-form-urlencoded') {
    return new Response(null,{status:403,headers});
  }
  const body = await request.text();
  if (body.length > 512) return new Response(null,{status:413,headers});
  const fields = new URLSearchParams(body);
  if (fields.get('entry') === 'protected-preview' && canOpenProtectedReview(host)) {
    return launchReview(name,password,createReviewInvitation(password));
  }
  const provided = fields.get('passcode') ?? '';
  if (!reviewPasscodeMatches(provided,password)) return sendTo('/private-review?status=invalid');

  return launchReview(name,password,name === 'imbhola-redesign-review' ? createReviewInvitation(password) : undefined);
}

export async function GET(request: Request) {
  const password = reviewLauncherPassword();
  const name = reviewSandboxName();
  const params = new URL(request.url).searchParams;
  const ticket = params.get('ticket');
  if (!password || !name || name !== 'imbhola-redesign-review') return new Response(null,{status:404,headers});
  if (params.get('open') === '1' && canOpenProtectedReview(request.headers.get('host'))) {
    return launchReview(name,password,createReviewInvitation(password));
  }
  if (!ticket || !hasReviewInvitation(ticket,password)) return sendTo('/private-review?status=invalid');
  return launchReview(name,password,ticket);
}

async function launchReview(name: string, password: string, ticket?: string) {
  try {
    const sandbox = await Sandbox.get({ name, resume:true, signal:AbortSignal.timeout(16_000) });
    if (sandbox.snapshotExpiration && sandbox.snapshotExpiration < retention) {
      try {
        await sandbox.update({snapshotExpiration:retention},{signal:AbortSignal.timeout(5000)});
      } catch {
        console.warn('Private review snapshot retention remains unchanged.');
      }
    }
    const url = new URL(sandbox.domain(port));
    if (url.protocol !== 'https:' || !/^sb-[a-z0-9]+\.vercel\.run$/.test(url.hostname)) {
      throw new Error('Unexpected review workspace hostname');
    }
    const destination = ticket ? new URL('/review-invitation?ticket='+encodeURIComponent(ticket),url).href : url.href;
    if (!(await ready(url))) {
      const args = ['-n','/tmp/imbhola-review.lock','node','scripts/review-server.mjs'];
      await sandbox.runCommand({
        cmd:'flock',args,detached:true,cwd:'/vercel/imbhola-platform',
        env:{
          IMBHOLA_REVIEW:'1',IMBHOLA_REVIEW_HOST:url.hostname,IMBHOLA_REVIEW_PASSWORD:password,
          NEXT_TELEMETRY_DISABLED:'1',PORT:String(port),
        },
      });
      for (let i = 0; i < 10; i++) {
        await setTimeout(1000);
        if (await ready(url)) return sendTo(destination);
      }
      throw new Error('Workspace did not become ready');
    }
    return sendTo(destination);
  } catch (error) {
    // Avoid exposing provider credentials or response contents in logs.
    console.error('Private review launcher:',error instanceof Error ? error.name : 'Unspecified error');
    return sendTo('/private-review?status=waiting');
  }
}
