import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { pilotWorkspaceConfig, productionWorkspaceConfig } from './config.ts';
import { verifyWorkspaceIdentity } from './identity.ts';

const issuer = 'https://identity.example.test';
const audience = 'https://api.imbhola.test';

test('production workforce routes require explicit production settings and constrain connections', () => {
  const configured = {
    VERCEL_ENV:'production',IMBHOLA_ENABLE_PRODUCTION_WORKSPACE:'1',
    IMBHOLA_DATABASE_URL:'postgres://runtime:synthetic-password@db.example.test/imbhola?sslmode=no-verify',
    IMBHOLA_IDENTITY_ISSUER:issuer,IMBHOLA_IDENTITY_JWKS_URL:issuer+'/.well-known/jwks.json',
    IMBHOLA_IDENTITY_AUDIENCE:audience,
  };
  assert.equal(productionWorkspaceConfig({...configured,VERCEL_ENV:'preview'}),undefined);
  assert.equal(productionWorkspaceConfig({...configured,IMBHOLA_ENABLE_PRODUCTION_WORKSPACE:'0'}),undefined);
  assert.equal(productionWorkspaceConfig({...configured,IMBHOLA_IDENTITY_JWKS_URL:'http://keys.example.test'}),undefined);
  assert.equal(productionWorkspaceConfig({...configured,IMBHOLA_DATABASE_URL:'postgres://db.example.test/imbhola'}),undefined);
  const production = productionWorkspaceConfig(configured);
  assert.equal(production?.database,'postgres://runtime:synthetic-password@db.example.test/imbhola');
  assert.equal(production?.issuer,issuer);
});

test('only fresh MFA access tokens signed by the configured provider can identify workforce users', async () => {
  const {publicKey,privateKey} = await generateKeyPair('RS256');
  const keys = createLocalJWKSet({keys:[{...await exportJWK(publicKey),kid:'test-key'}]});
  const config = {issuer,audience};
  async function authenticate(options: {
    issuer?:string; audience?:string; methods?:string[]; expiry?:string; issuedAt?:number; tokenType?:string;
  } = {}) {
    const token = await new SignJWT({amr:options.methods ?? ['pwd','mfa']})
      .setProtectedHeader({alg:'RS256',kid:'test-key',typ:options.tokenType ?? 'at+jwt'})
      .setSubject('synthetic-user')
      .setIssuer(options.issuer ?? issuer)
      .setAudience(options.audience ?? audience)
      .setIssuedAt(options.issuedAt ?? Math.floor(Date.now() / 1000))
      .setExpirationTime(options.expiry ?? '5 minutes')
      .sign(privateKey);
    return verifyWorkspaceIdentity('Bearer '+token,keys,config);
  }
  assert.deepEqual(await authenticate(),{issuer,subject:'synthetic-user'});
  assert.equal(await authenticate({issuer:'https://elsewhere.example.test'}),undefined);
  assert.equal(await authenticate({audience:'https://other-api.example.test'}),undefined);
  assert.equal(await authenticate({methods:['pwd']}),undefined);
  assert.equal(await authenticate({expiry:'2 seconds ago'}),undefined);
  assert.equal(await authenticate({issuedAt:Math.floor(Date.now()/1000)-660}),undefined);
  assert.equal(await authenticate({tokenType:'JWT'}),undefined);
  assert.equal(await verifyWorkspaceIdentity('Bearer sample.review.credential',keys,config),undefined);
});

test('Descope mode requires explicit selection and a project identifier', () => {
  const config = {
    VERCEL_ENV:'production',IMBHOLA_ENABLE_PRODUCTION_WORKSPACE:'1',
    IMBHOLA_DATABASE_URL:'postgres://runtime:synthetic-password@db.example.test/imbhola',
    IMBHOLA_IDENTITY_MODE:'descope',
  };
  assert.equal(productionWorkspaceConfig(config),undefined);
  assert.equal(productionWorkspaceConfig({...config,NEXT_PUBLIC_DESCOPE_PROJECT_ID:'PsyntheticProject'})?.mode,'descope');
  assert.equal(productionWorkspaceConfig({...config,IMBHOLA_IDENTITY_MODE:'other',NEXT_PUBLIC_DESCOPE_PROJECT_ID:'PsyntheticProject'}),undefined);
});

test('Descope identities require a verified, recent MFA session for the selected project', async () => {
  const {createDescopeWorkspaceVerifier} = await import('./descope.ts');
  const now = Math.floor(Date.now() / 1000);
  const base = {sub:'synthetic-user',amr:['pwd','mfa'],iat:now};
  const project = 'PsyntheticProject';
  const valid = createDescopeWorkspaceVerifier(project,async () => ({token:base}));
  assert.deepEqual(await valid('Bearer synthetic.token'),{issuer:'descope:' + project,subject:'synthetic-user'});
  assert.equal(await valid(null),undefined);
  const noMfa = createDescopeWorkspaceVerifier(project,async () => ({token:{...base,amr:['pwd']}}));
  assert.equal(await noMfa('Bearer synthetic.token'),undefined);
  const old = createDescopeWorkspaceVerifier(project,async () => ({token:{...base,iat:now-601}}));
  assert.equal(await old('Bearer synthetic.token'),undefined);
  const bound = createDescopeWorkspaceVerifier(project,async () => ({token:{...base,cnf:{jkt:'fixture'}}}));
  assert.equal(await bound('Bearer synthetic.token'),undefined);
  const rejected = createDescopeWorkspaceVerifier(project,async () => { throw new Error('Other project'); });
  assert.equal(await rejected('Bearer synthetic.token'),undefined);
});

test('pilot requires distinct branch-only settings and fails closed with production values', () => {
  const preview = {
    VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/v3-3-platform-foundation',IMBHOLA_ENABLE_PILOT_WORKSPACE:'1',
    IMBHOLA_PILOT_DATABASE_URL:'postgres://runtime:sample@db.example.test/pilot?sslmode=disable',
    IMBHOLA_PILOT_DESCOPE_PROJECT_ID:'PsyntheticProject',IMBHOLA_PILOT_DESCOPE_FLOW_ID:'pilot-mfa',
  };
  assert.deepEqual(pilotWorkspaceConfig(preview),{
    mode:'descope',database:'postgres://runtime:sample@db.example.test/pilot',
    projectId:'PsyntheticProject',flowId:'pilot-mfa',
  });
  assert.equal(pilotWorkspaceConfig({...preview,VERCEL_ENV:'production'}),undefined);
  assert.equal(pilotWorkspaceConfig({...preview,VERCEL_GIT_COMMIT_REF:'main'}),undefined);
  assert.equal(pilotWorkspaceConfig({...preview,IMBHOLA_PILOT_DATABASE_URL:undefined,IMBHOLA_DATABASE_URL:preview.IMBHOLA_PILOT_DATABASE_URL}),undefined);
  assert.equal(pilotWorkspaceConfig({...preview,IMBHOLA_PILOT_DESCOPE_FLOW_ID:undefined}),undefined);
});

test('workforce edits enforce supported employee identifiers, statuses and lengths', async () => {
  const {validateWorkforceEdit} = await import('./workforce.ts');
  const input = {employeeNumber:'AT-001',jobTitle:' Coordinator ',department:'Training',status:'active',intent:'create'};
  assert.deepEqual(validateWorkforceEdit(input),{...input,jobTitle:'Coordinator'});
  assert.equal(validateWorkforceEdit({...input,employeeNumber:'A-001 '}),undefined);
  assert.equal(validateWorkforceEdit({...input,intent:'delete'}),undefined);
  assert.equal(validateWorkforceEdit({...input,department:'x'.repeat(121)}),undefined);
  assert.equal(validateWorkforceEdit({...input,status:'pending'}),undefined);
});
