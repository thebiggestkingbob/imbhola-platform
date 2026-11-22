export function localWorkspaceEnabled() {
  return process.env.NODE_ENV === 'development' &&
    process.env.IMBHOLA_LOCAL === '1' && !process.env.VERCEL;
}
