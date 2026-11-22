import { jwtVerify, type JWTVerifyGetKey } from 'jose';

export type VerifiedIdentity = { issuer: string; subject: string };

export async function verifyWorkspaceIdentity(
  authorization: string | null,
  keys: JWTVerifyGetKey,
  config: {issuer:string;audience:string},
): Promise<VerifiedIdentity | undefined> {
  if (!authorization || authorization.length > 8_300) return;
  const token = /^Bearer ([\w.-]+)$/i.exec(authorization)?.[1];
  if (!token) return;
  try {
    const {payload} = await jwtVerify(token,keys,{
      issuer:config.issuer,audience:config.audience,algorithms:['RS256'],typ:'at+jwt',
      requiredClaims:['sub','iat','exp','amr'],maxTokenAge:'10 minutes',
    });
    if (!payload.sub?.trim() || payload.sub.length > 512 ||
      !Array.isArray(payload.amr) || !payload.amr.includes('mfa')) return;
    return {issuer:config.issuer,subject:payload.sub};
  } catch {
    return;
  }
}
