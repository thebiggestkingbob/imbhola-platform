import type { NextConfig } from 'next';
import { demoPath, demoRuntimeEnabled } from './src/demo/config';

const demo = demoRuntimeEnabled();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(demo ? {basePath:demoPath,distDir:'.next-demo'} : {}),
  async rewrites() {
    return demo ? [] : [{source:demoPath+'/:path*',destination:'/api/demo-forward/:path*'}];
  },
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
};
export default nextConfig;
