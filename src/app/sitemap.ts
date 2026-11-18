import type { MetadataRoute } from 'next';

/** No public URLs published during the private alpha. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
