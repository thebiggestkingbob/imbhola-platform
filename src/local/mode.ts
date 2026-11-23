export function reviewWorkspaceEnabled() {
  return process.env.IMBHOLA_REVIEW === '1' && !process.env.VERCEL &&
    process.env.VERCEL_ENV !== 'production';
}

export function localWorkspaceEnabled() {
  return reviewWorkspaceEnabled() || (
    process.env.NODE_ENV === 'development' && process.env.IMBHOLA_LOCAL === '1' && !process.env.VERCEL
  );
}
