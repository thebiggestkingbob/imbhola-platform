import { createHash, timingSafeEqual } from 'node:crypto';

const sandboxes = {
  'feature/v3-3-platform-foundation':'imbhola-private-review',
  'feature/imbhola-redesign':'imbhola-redesign-review',
} as const;

export function reviewSandboxName() {
  if (process.env.VERCEL_ENV !== 'preview') return;
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? '';
  return Object.hasOwn(sandboxes,branch) ? sandboxes[branch as keyof typeof sandboxes] : undefined;
}

export function reviewLauncherPassword() {
  const secret = process.env.IMBHOLA_PREVIEW_REVIEW_PASSWORD;
  if (!reviewSandboxName() ||
      !secret || !/^[A-Za-z0-9_-]{24,128}$/.test(secret)) return;
  return secret;
}

export function reviewPasscodeMatches(provided: string, expected: string) {
  if (provided.length > 128) return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided),digest(expected));
}
