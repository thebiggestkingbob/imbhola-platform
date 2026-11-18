import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 3197;
const origin = `http://127.0.0.1:${port}`;
let output = '';
const child = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', 'start', '--hostname','127.0.0.1', '--port', String(port)
], {
  env: {
    ...process.env,
    IMBHOLA_AUTH_SIGNIN_ENABLED: 'false',
    IMBHOLA_AUTH_SIGNUP_ENABLED: 'false',
    IMBHOLA_COMPANY_APPLICATIONS_ENABLED: 'false',
    IMBHOLA_INVITATIONS_ENABLED: 'false',
    IMBHOLA_OPERATOR_APPROVALS_ENABLED: 'false',
  },
  stdio: ['ignore','pipe','pipe'],
});
child.stdout.on('data', c => { output += c.toString(); });
child.stderr.on('data', c => { output += c.toString(); });

async function get(path) {
  return fetch(origin + path, { redirect:'manual', headers: { 'Cache-Control':'no-cache' } });
}

async function main(){
  let ready = false;
  for(let i=0;i<80;i++){
    if(child.exitCode!==null)break;
    try {const response = await get('/api/health'); if(response.status===200){ready=true;break;}}
    catch {/* server not ready yet */}
    await delay(300);
  }
  if(!ready)throw Error('Next.js server did not start:\n'+output.slice(-3000));

  const checks = [
    ['/',200],['/platform',200],['/solutions',200],['/how-it-works',200],
    ['/about',200],['/contact',200],['/login',200],['/signup',200],
    ['/apply',200],['/dashboard',200],['/api/health',200],
    ['/api/account',503],['/workspace/invalid-id',404],['/ops/applications',404],
  ];
  for(const [path,expected] of checks){
    const response=await get(path);
    if(response.status!==expected){
      throw Error(path+' returned '+response.status+' instead of '+expected);
    }
    console.log('PASS',path,response.status);
  }
  const rootResponse=await get('/');
  if(rootResponse.headers.get('x-frame-options')!=='DENY')throw Error('Frame embedding must be denied');
  if(rootResponse.headers.get('x-content-type-options')!=='nosniff')throw Error('MIME sniffing protection missing');
  if(!rootResponse.headers.get('x-robots-tag')?.includes('noindex'))throw Error('Private preview must not be indexed');
  const robotsResponse=await get('/robots.txt');
  if(robotsResponse.status!==200 || !(await robotsResponse.text()).includes('Disallow: /')){
    throw Error('Private preview robots policy missing');
  }
  const health=await (await get('/api/health')).json();
  if(health.officialSetaExports!==false)throw Error('Official SETA exports must remain disabled');
  const account=await (await get('/api/account')).json();
  if(account.authenticated!==false || account.identitySignInEnabled!==false){
    throw Error('Account endpoint must fail closed when sign-in disabled');
  }
  const loginHtml=await (await get('/login')).text();
  if(loginHtml.includes('name="password"'))throw Error('Disabled login renders a credential form');
  console.log('Public preview smoke tests passed.');
}
try{await main();}catch(err){console.error(err);process.exitCode=1;}
finally{child.kill('SIGTERM');}
