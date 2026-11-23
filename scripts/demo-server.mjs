import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import next from 'next';
import { demoCookie, demoHost, demoPath, demoProxyHeader, demoRuntimeEnabled } from '../src/demo/config.ts';
import { demoScope } from '../src/demo/scope.ts';
import { openDatabase } from '../src/local/db.ts';
import { seed, seedWalkthrough } from '../src/local/seed.ts';

const port = Number(process.env.PORT || 3000);
const secret = process.env.IMBHOLA_DEMO_PROXY_SECRET ?? '';
if (!demoRuntimeEnabled() || !/^[a-f0-9]{64}$/.test(secret)) {
  throw new Error('The sample workspace needs an isolated runtime and proxy key.');
}
const workspaceRoutes = new Set(['access','login','dashboard','workspace','admin','sdf','report-review',
  'report-snapshot','evidence','contact','request-demo']);
const origin = 'https://' + demoHost;
const lifetime = 24 * 60 * 60;
const storage = '.imbhola-local/public-demo';
const year = new Date().getFullYear();
const template = storage + '/template-' + year + '.sqlite';
mkdirSync(storage, { recursive: true, mode: 0o700 });
if (!existsSync(template)) {
  const draft = template + '.new';
  const db = openDatabase(draft);
  seed(db, randomBytes(32).toString('hex'));
  seedWalkthrough(db,year);
  db.close();
  renameSync(draft,template);
}
process.env.__NEXT_PRIVATE_ORIGIN = 'http://127.0.0.1:' + port;
const app = next({dev:false, hostname:'127.0.0.1', port});
const handle = app.getRequestHandler();
await app.prepare();

function equal(candidate, expected) {
  if (typeof candidate !== 'string') return false;
  const received = Buffer.from(candidate);
  const wanted = Buffer.from(expected);
  return received.length === wanted.length && timingSafeEqual(received,wanted);
}

function signature(value) {
  return createHmac('sha256',secret).update('browser:' + value).digest('hex');
}

function browserSession(cookies) {
  const token = cookies?.split(';').map(part=>part.trim()).find(part=>part.startsWith(demoCookie+'='))?.split('=')[1];
  const parsed = /^(\d{10}-[a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token ?? '');
  if (!parsed || Number(parsed[1].slice(0,10)) <= Date.now()/1000 || !equal(parsed[2],signature(parsed[1]))) return;
  const database = storage + '/' + parsed[1] + '.sqlite';
  if (existsSync(database)) return database;
}

function startSession(res) {
  const expiry = Math.floor(Date.now() / 1000) + lifetime;
  const id = expiry + '-' + randomBytes(16).toString('hex');
  const databases = readdirSync(storage).filter(file=>/^\d{10}-[a-f0-9]{32}\.sqlite$/.test(file));
  let active = 0;
  for (const file of databases) {
    if (Number(file.slice(0,10)) > Date.now()/1000) active++;
    else unlinkSync(storage + '/' + file);
  }
  if (active >= 150) return res.writeHead(503,{'Retry-After':'120'}).end('The sample workspace is at capacity. Please try again later.');
  copyFileSync(template,storage + '/' + id + '.sqlite');
  res.setHeader('Set-Cookie',demoCookie+'='+id+'.'+signature(id)+'; Path='+demoPath+'; Secure; HttpOnly; SameSite=Lax; Max-Age='+lifetime);
}

createServer(async (req,res) => {
  const writeHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    const location = res.getHeader('Location');
    if (typeof location === 'string' && /^\/(?!\/)/.test(location) && !location.startsWith(demoPath+'/')) {
      res.setHeader('Location',demoPath+location);
    }
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    return writeHead(...args);
  };
  try {
    if (!equal(req.headers[demoProxyHeader],secret)) return res.writeHead(404).end();
    const pathname = new URL(req.url,origin).pathname;
    if (!['GET','HEAD','POST'].includes(req.method)) return res.writeHead(405).end();
    if (pathname === demoPath + '/health') return res.writeHead(204).end();
    if (pathname === demoPath || pathname === demoPath + '/') return res.writeHead(303,{Location:demoPath+'/login'}).end();
    const [root,nextPart] = pathname.slice(demoPath.length+1).split('/');
    if (!pathname.startsWith(demoPath + '/')) return res.writeHead(404).end();
    if (req.method === 'POST' && req.headers.origin !== origin) return res.writeHead(403).end();
    req.headers.host = demoHost;
    req.headers['x-forwarded-host'] = demoHost;
    req.headers['x-forwarded-proto'] = 'https';
    req.headers['x-forwarded-port'] = '443';
    if ((root === '_next' && nextPart === 'static') || root === 'favicon.ico') return await handle(req,res);
    if (!workspaceRoutes.has(root)) return res.writeHead(404).end();
    const database = browserSession(req.headers.cookie);
    if (!database) {
      if (req.method === 'POST') return res.writeHead(409).end('Your sample workspace expired. Reopen the workspace to start again.');
      if (pathname !== demoPath + '/login') return res.writeHead(303,{Location:demoPath+'/login'}).end();
      if (!req.headers.rsc && req.method === 'GET' && startSession(res)) return;
      return await handle(req,res);
    }
    const db = openDatabase(database);
    db.exec('PRAGMA max_page_count = 8192;');
    try {
      await demoScope.run(db,()=>handle(req,res));
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Sample workspace:',error instanceof Error ? error.name : 'Unknown error');
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port,'0.0.0.0',()=>console.log('Sample workspace listening on ' + port));
