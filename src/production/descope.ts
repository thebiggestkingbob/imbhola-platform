import DescopeClient from '@descope/node-sdk';
import { workspaceBearerToken, type VerifiedIdentity } from './identity.ts';

type Claims = {sub?:string;iat?:unknown;amr?:unknown;cnf?:unknown};
type ValidateSession = (token: string) => Promise<{token:Claims}>;

export function createDescopeWorkspaceVerifier(projectId: string, validate?: ValidateSession) {
  const validateSession = validate ?? (() => {
    const client = DescopeClient({projectId});
    return (token: string) => client.validateSession(token,{audience:projectId});
  })();

  return async (authorization: string | null): Promise<VerifiedIdentity | undefined> => {
    const token = workspaceBearerToken(authorization);
    if (!token) return;
    try {
      const {token:claims} = await validateSession(token);
      const seconds = Math.floor(Date.now() / 1000);
      if (!claims.sub?.trim() || claims.sub.length > 512 || claims.cnf ||
        typeof claims.iat !== 'number' || !Number.isInteger(claims.iat) ||
        claims.iat > seconds + 5 || claims.iat < seconds - 600 ||
        !Array.isArray(claims.amr) || !claims.amr.includes('mfa')) return;
      return {issuer:'descope:' + projectId,subject:claims.sub};
    } catch {
      return;
    }
  };
}
