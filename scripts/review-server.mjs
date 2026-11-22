import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import next from 'next';

const password = process.env.IMBHOLA_REVIEW_PASSWORD;
const host = process.env.IMBHOLA_REVIEW_HOST;
const port = Number(process.env.PORT || 3000);
if (process.env.IMBHOLA_REVIEW !== '1' || process.env.VERCEL || process.env.VERCEL_ENV === 'production' ||
    !password || !/^[A-Za-z0-9_-]{24,128}$/.test(password) || !host || !/^[a-z0-9.-]+$/.test(host) ||
    !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Private review must be configured in an isolated server with an HTTPS hostname and a strong passcode.');
}

const origin = 'https://' + host;
const cookieName = '__Host-imbhola-review';
const validFor = 4 * 60 * 60;
const gatePath = '/review-unlock';
const app = next({ dev: false, hostname: host, port });
const handle = app.getRequestHandler();
await app.prepare();

function mac(value) {
  return createHmac('sha256', password).update(value).digest('base64url');
}

function same(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a,b);
}

function hasPass(headers) {
  const token = (headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token || !/^\d{10}\.[\w-]{43}$/.test(token)) return false;
  const [expiry, signature] = token.split('.');
  return Number(expiry) > Date.now() / 1000 && same(signature,mac('review-cookie:' + expiry));
}

function gate(res, issue = '') {
  res.writeHead(issue ? 401 : 200, {
    'Cache-Control':'private, no-store',
    'Content-Type':'text/html; charset=utf-8',
    'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff',
    'X-Robots-Tag':'noindex, nofollow',
  });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private review | IMBHOLA</title>
  <style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:20px;background:#f6f4ed;color:#1e2c28;font-family:system-ui,sans-serif}main{background:white;width:min(100%,420px);padding:clamp(22px,6vw,38px);border:1px solid #d5d8d0;border-radius:14px}h1{line-height:1.1;margin:12px 0}p{line-height:1.5}.brand{font-weight:800;letter-spacing:.11em}label{display:block;font-weight:650}input,button{width:100%;min-height:48px;margin-top:10px;border-radius:6px;font:inherit}input{border:1px solid #667770;padding:10px 12px}button{border:0;background:#214139;color:white;font-weight:750;cursor:pointer}.error{color:#88251e}</style></head>
  <body><main><span class="brand">IMBHOLA</span><h1>Private workspace review</h1><p>Enter the review passcode to open the workspaces. Use sample data during the review.</p>
  <form method="post" action="${gatePath}"><label for="passcode">Review passcode</label><input id="passcode" name="passcode" type="password" required autocomplete="off" maxlength="128">
  ${issue ? '<p class="error" role="alert">The passcode was incorrect.</p>' : ''}<button>Open private review</button></form></main></body></html>`);
}

createServer(async (req,res) => {
  try {
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    const incomingHost = req.headers['x-forwarded-host'] || req.headers.host;
    if (incomingHost !== host) {
      res.writeHead(421).end();
      return;
    }
    if (req.url === gatePath && req.method === 'POST') {
      if (req.headers.origin !== origin || req.headers['content-type']?.split(';',1)[0] !== 'application/x-www-form-urlencoded') {
        res.writeHead(403).end();
        return;
      }
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 512) {
          res.writeHead(413).end();
          return;
        }
      }
      const candidate = new URLSearchParams(body).get('passcode') || '';
      if (!same(mac('review-entry:' + candidate),mac('review-entry:' + password))) {
        gate(res,'invalid');
        return;
      }
      const expiry = String(Math.floor(Date.now() / 1000) + validFor);
      res.writeHead(303,{
        'Location':'/login',
        'Set-Cookie':cookieName+'='+expiry+'.'+mac('review-cookie:' + expiry)+'; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age='+validFor,
      }).end();
      return;
    }
    if (!hasPass(req.headers)) {
      if (req.method === 'GET' || req.method === 'HEAD') gate(res);
      else res.writeHead(403).end();
      return;
    }
    req.headers['x-forwarded-host'] = host;
    req.headers['x-forwarded-proto'] = 'https';
    // Next may set its own cache policy for pre-rendered pages. Keep the
    // authenticated response private when headers are committed.
    const writeHead = res.writeHead.bind(res);
    res.writeHead = (...args) => {
      res.setHeader('Cache-Control','private, no-store');
      return writeHead(...args);
    };
    await handle(req,res);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port,'0.0.0.0',() => console.log('Private review listening on port ' + port));
