import { fetchJson } from "@/lib/api-client";
import type {
  AnnouncementItem,
  FaqItem,
  GalleryItem,
  HomeEvent,
  HomeStatistics,
  LeaderboardEntry,
  NewsletterPayload,
  RegistrationProgress,
  SponsorItem,
  TestimonialItem,
  ThemeItem,
} from "@/types/home";

const base = "/api/home";

export const homeService = {
  getEvent: () => fetchJson<HomeEvent>(`${base}/event`),
  getStatistics: () => fetchJson<HomeStatistics>(`${base}/statistics`),
  getLeaderboard: (tab = "overall") =>
    fetchJson<LeaderboardEntry[]>(`${base}/leaderboard?tab=${encodeURIComponent(tab)}`),
  getThemes: () => fetchJson<ThemeItem[]>(`${base}/themes`),
  getAnnouncements: () => fetchJson<AnnouncementItem[]>(`${base}/announcements`),
  getGallery: () => fetchJson<GalleryItem[]>(`${base}/gallery`),
  getFaq: () => fetchJson<FaqItem[]>(`${base}/faq`),
  getSponsors: () => fetchJson<SponsorItem[]>(`${base}/sponsors`),
  getTestimonials: () => fetchJson<TestimonialItem[]>(`${base}/testimonials`),
  getRegistration: () =>
    fetchJson<RegistrationProgress>(`${base}/registration`),
  subscribeNewsletter: (payload: NewsletterPayload) =>
    fetchJson<{ ok: boolean; message: string }>(`${base}/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
