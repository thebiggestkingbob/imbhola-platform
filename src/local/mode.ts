import { demoRuntimeEnabled } from '../demo/config.ts';

export function reviewWorkspaceEnabled() {
  return process.env.IMBHOLA_REVIEW === '1' && !process.env.VERCEL &&
    process.env.VERCEL_ENV !== 'production';
}

export function localWorkspaceEnabled() {
  return demoRuntimeEnabled() || reviewWorkspaceEnabled() || (
    process.env.NODE_ENV === 'development' && process.env.IMBHOLA_LOCAL === '1' && !process.env.VERCEL
  );
}
