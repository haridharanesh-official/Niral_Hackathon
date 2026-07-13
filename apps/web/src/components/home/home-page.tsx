"use client";

import { SkipToContent } from "@/components/common/skip-to-content";
import { HomeUiProvider } from "@/store/home-ui";
import { NavigationBar } from "@/components/navigation";
import { HeroSection } from "@/components/hero";
import { EmergencyBanner } from "@/components/landing/emergency-banner";
import { AnnouncementBanner } from "@/components/landing/announcement-banner";
import { StatsSection } from "@/components/landing/stats-section";
import { AboutSection } from "@/components/landing/about-section";
import { WhyParticipateSection } from "@/components/landing/why-participate-section";
import { ChallengesSection } from "@/components/landing/challenges-section";
import { ProblemStatementsSection } from "@/components/landing/problem-statements-section";
import { LiveStatisticsSection } from "@/components/landing/live-statistics-section";
import { RegistrationProgressSection } from "@/components/home/registration-progress";
import { PrizePoolSection } from "@/components/landing/prize-pool-section";
import { FeaturedTechnologiesSection } from "@/components/landing/featured-technologies-section";
import { TimelineSection } from "@/components/landing/timeline-section";
import { SponsorsSection } from "@/components/sponsors/sponsors-section";
import { WinnersSection } from "@/components/landing/winners-section";
import { SuccessStoriesSection } from "@/components/landing/success-stories-section";
import { TestimonialsSection } from "@/components/testimonials/testimonials-section";
import { LeaderboardTeaser } from "@/components/leaderboard/live-leaderboard";
import { DailyChallengeSection } from "@/components/landing/daily-challenge-section";
import { MiniGamesSection } from "@/components/landing/mini-games-section";
import { GallerySection } from "@/components/gallery/innovation-gallery";
import { LiveEventFeedSection } from "@/components/landing/live-event-feed-section";
import { LivePollsSection } from "@/components/landing/live-polls-section";
import { WorldMapSection } from "@/components/landing/world-map-section";
import { InnovationHeatMapSection } from "@/components/landing/innovation-heat-map-section";
import { SocialMediaWallSection } from "@/components/landing/social-media-wall-section";
import { ResourcesSection } from "@/components/landing/resources-section";
import { FaqSection } from "@/components/home/faq-section";
import { ContactNewsletterSection } from "@/components/home/newsletter-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { QuickActionsDock } from "@/components/landing/quick-actions-dock";
import { AiAssistantWidget } from "@/components/home/ai-assistant-widget";

export function HomePage() {
  return (
    <HomeUiProvider>
      <SkipToContent />
      <EmergencyBanner />
      <AnnouncementBanner />
      <NavigationBar />
      <main id="main-content" className="pb-24">
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <WhyParticipateSection />
        <ChallengesSection />
        <ProblemStatementsSection />
        <LiveStatisticsSection />
        <RegistrationProgressSection />
        <PrizePoolSection />
        <FeaturedTechnologiesSection />
        <TimelineSection />
        <SponsorsSection />
        <WinnersSection />
        <SuccessStoriesSection />
        <TestimonialsSection />
        <LeaderboardTeaser />
        <DailyChallengeSection />
        <MiniGamesSection />
        <GallerySection />
        <LiveEventFeedSection />
        <LivePollsSection />
        <WorldMapSection />
        <InnovationHeatMapSection />
        <SocialMediaWallSection />
        <ResourcesSection />
        <FaqSection />
        <ContactNewsletterSection />
      </main>
      <SiteFooter />
      <QuickActionsDock />
      <AiAssistantWidget />
    </HomeUiProvider>
  );
}
