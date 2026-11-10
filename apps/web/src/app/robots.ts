import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/site-origin';

const siteUrl = siteOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      ...(process.env.VERCEL_ENV === 'preview'
        ? { disallow: '/' }
        : { allow: '/', disallow: ['/dashboard/', '/admin/', '/api/auth/'] }),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
