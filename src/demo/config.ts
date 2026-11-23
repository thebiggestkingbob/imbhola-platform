export const demoPath = '/demo';
export const demoHost = 'imbhola-platform.vercel.app';
export const demoSandbox = 'imbhola-public-demo';
export const demoProxyHeader = 'x-imbhola-demo-proxy';
export const demoCookie = '__Secure-imbhola-demo';
export const demoSessionCookie = '__Secure-imbhola-demo-role';

export function demoRuntimeEnabled() {
  return process.env.IMBHOLA_DEMO_RUNTIME === '1' && !process.env.VERCEL &&
    process.env.VERCEL_ENV !== 'production';
}

export function productionDemoEnabled() {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production' &&
    /^[a-f0-9]{64}$/.test(process.env.IMBHOLA_DEMO_PROXY_SECRET ?? '') &&
    /^https:\/\/sb-[a-z0-9]+\.vercel\.run$/.test(process.env.IMBHOLA_DEMO_SANDBOX_URL ?? '');
}
