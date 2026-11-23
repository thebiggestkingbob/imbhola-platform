import { createHash, timingSafeEqual } from 'node:crypto';

export function reviewLauncherPassword() {
  const secret = process.env.IMBHOLA_PREVIEW_REVIEW_PASSWORD;
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feature/v3-3-platform-foundation' ||
      !secret || !/^[A-Za-z0-9_-]{24,128}$/.test(secret)) return;
  return secret;
}

export function reviewPasscodeMatches(provided: string, expected: string) {
  if (provided.length > 128) return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided),digest(expected));
}
