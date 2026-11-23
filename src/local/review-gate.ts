import { createHmac, timingSafeEqual } from 'node:crypto';

export const reviewCookieName = '__Host-imbhola-review';

export function reviewCookieToken(password: string, expiry: string) {
  const signature = createHmac('sha256',password).update('review-cookie:' + expiry).digest('base64url');
  return expiry + '.' + signature;
}

export function hasReviewCookie(token: string | undefined, password: string, now = Date.now()) {
  if (!token || !/^\d{10}\.[\w-]{43}$/.test(token)) return false;
  const expiry = token.slice(0,10);
  return Number(expiry) > now / 1000 &&
    timingSafeEqual(Buffer.from(token),Buffer.from(reviewCookieToken(password,expiry)));
}

export function hasReviewInvitation(token: string | null, password: string, now = Date.now()) {
  if (!token || !/^\d{10}\.[\w-]{43}$/.test(token)) return false;
  const expiry = token.slice(0,10);
  if (Number(expiry) <= now / 1000 || Number(expiry) > now / 1000 + 86400) return false;
  const signature = createHmac('sha256',password).update('review-invitation:' + expiry).digest('base64url');
  return timingSafeEqual(Buffer.from(token.slice(11)),Buffer.from(signature));
}

export const reviewAccounts = [
  ['owner','Employer owner'],
  ['sdf','Skills Development Facilitator'],
  ['ops','Imbhola administrator'],
  ['committee','Committee reviewer'],
  ['signatory','Employer signatory'],
  ['hr','HR practitioner'],
  ['training','Training coordinator'],
  ['finance','Finance reviewer'],
  ['beacon-owner','Beacon employer owner'],
] as const;
