import { Sandbox } from '@vercel/sandbox';
import { setTimeout as delay } from 'node:timers/promises';
import { demoCookie, demoHost, demoPath, demoProxyHeader, demoSandbox, demoSessionCookie, productionDemoEnabled } from '@/demo/config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const port = 3000;
const privateHeaders = {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
const requestHeaders = ['accept','content-type','next-action','next-router-state-tree','next-router-prefetch',
  'next-router-segment-prefetch','next-url','origin','rsc','sec-fetch-mode'];
const responseHeaders = ['content-type','content-disposition','location','retry-after','vary','x-action-redirect',
  'x-action-revalidated','x-content-type-options','x-frame-options','x-nextjs-prerender'];

function sandboxOrigin(value: string) {
  const url = new URL(value);
  if (!/^https:\/\/sb-[a-z0-9]+\.vercel\.run$/.test(url.origin)) throw new Error('Unexpected sample workspace host');
  return url.origin;
}

async function wake(origin: string, secret: string) {
  const sandbox = await Sandbox.get({name:demoSandbox,resume:true,signal:AbortSignal.timeout(18_000)});
  const target = sandboxOrigin(sandbox.domain(port));
  // The lock also covers concurrent instances starting the same named sandbox.
  await sandbox.runCommand({
    cmd:'flock',args:['-n','/tmp/imbhola-demo.lock','node','scripts/demo-server.mjs'],detached:true,
    cwd:'/vercel/imbhola-platform',env:{
      IMBHOLA_DEMO_RUNTIME:'1',IMBHOLA_DEMO_PROXY_SECRET:secret,PORT:String(port),NEXT_TELEMETRY_DISABLED:'1',
    },
  });
  for (let attempt = 0; attempt < 13; attempt++) {
    try {
      const check = await fetch(target+demoPath+'/health',{
        headers:{[demoProxyHeader]:secret},cache:'no-store',signal:AbortSignal.timeout(800),
      });
      if (check.status === 204) return target;
    } catch {}
    await delay(750);
  }
  throw new Error('Sample workspace unavailable at ' + (origin === target ? 'current' : 'resumed') + ' origin');
}

let starting: Promise<string> | undefined;

async function forward(request: Request, {params}: {params:Promise<{path?:string[]}>}) {
  if (!productionDemoEnabled() || request.headers.get('host') !== demoHost) {
    return new Response(null,{status:404,headers:privateHeaders});
  }
  if (request.method === 'POST' && request.headers.get('origin') !== 'https://' + demoHost) {
    return new Response(null,{status:403,headers:privateHeaders});
  }
  const {path = []} = await params;
  if (path.some(part=>part === '.' || part === '..' || /[\\/]/.test(part))) {
    return new Response(null,{status:404,headers:privateHeaders});
  }
  const destination = demoPath + (path.length ? '/'+path.map(encodeURIComponent).join('/') : '') + new URL(request.url).search;
  const secret = process.env.IMBHOLA_DEMO_PROXY_SECRET!;
  const headers = new Headers({[demoProxyHeader]:secret});
  for (const name of requestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name,value);
  }
  const cookies = request.headers.get('cookie')?.split(';').map(part=>part.trim()).filter(part=>
    part.startsWith(demoCookie+'=') || part.startsWith(demoSessionCookie+'='));
  if (cookies?.length) headers.set('cookie',cookies.join('; '));
  const limit = 3 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > limit) return new Response(null,{status:413,headers:privateHeaders});
  const body = request.method === 'POST' ? await request.arrayBuffer() : undefined;
  if (body && body.byteLength > limit) return new Response(null,{status:413,headers:privateHeaders});
  const send = (origin: string) => fetch(origin+destination,{
    method:request.method,body,headers,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10_000),
  });

  try {
    let origin = sandboxOrigin(process.env.IMBHOLA_DEMO_SANDBOX_URL!);
    let result = await send(origin).catch(()=>undefined);
    if (!result?.headers.has('x-robots-tag')) {
      if (request.method === 'POST') throw new Error('Retry this action after reopening the sample workspace');
      await result?.body?.cancel();
      starting ??= wake(origin,secret).finally(()=>{starting=undefined;});
      origin = await starting;
      result = await send(origin);
    }
    if (!result.headers.has('x-robots-tag')) throw new Error('Unverified workspace response');
    const output = new Headers(privateHeaders);
    for (const name of responseHeaders) {
      const value = result.headers.get(name);
      if (value) output.set(name,value.replaceAll(origin,'https://'+demoHost));
    }
    for (const cookie of result.headers.getSetCookie()) {
      if (cookie.startsWith(demoCookie+'=') || cookie.startsWith(demoSessionCookie+'=')) output.append('Set-Cookie',cookie);
    }
    return new Response(result.body,{status:result.status,headers:output});
  } catch (error) {
    console.error('Sample workspace proxy:',error instanceof Error ? error.name : 'Unknown error');
    return new Response('The sample workspace is starting. Open Workspace access again in a moment.',{
      status:503,headers:{...privateHeaders,'Content-Type':'text/plain; charset=utf-8','Retry-After':'10'},
    });
  }
}

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
