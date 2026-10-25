import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hackos.app";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/participate', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/tracks', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/problems', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/schedule', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/rules', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/updates', priority: 0.85, changeFrequency: 'daily' as const },
    { path: '/faq', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/register', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/leaderboard', priority: 0.7, changeFrequency: 'hourly' as const },
  ];

  return routes.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
