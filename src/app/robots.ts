import type { MetadataRoute } from 'next';

/** Private alpha: do not allow indexing until legal, security and launch approval. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
