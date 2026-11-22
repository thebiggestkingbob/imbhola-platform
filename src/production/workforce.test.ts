import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { productionWorkspaceConfig } from './config.ts';
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
