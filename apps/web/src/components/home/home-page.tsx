"use client";

import { SkipToContent } from "@/components/common/skip-to-content";
import { HomeUiProvider } from "@/store/home-ui";
import { NavigationBar } from "@/components/navigation";
import { HeroSection } from "@/components/hero";
import { EmergencyBanner } from "@/components/landing/emergency-banner";
import { AnnouncementBanner } from "@/components/landing/announcement-banner";
import { AboutSection } from "@/components/landing/about-section";
import { StatsSection } from "@/components/landing/stats-section";
import { ChallengesSection } from "@/components/landing/challenges-section";
import { ProblemStatementsSection } from "@/components/landing/problem-statements-section";
import { TimelineSection } from "@/components/landing/timeline-section";
import { RulesSection } from "@/components/landing/rules-section";
import { PrizePoolSection } from "@/components/landing/prize-pool-section";
import { MentorsSection } from "@/components/landing/mentors-section";
import { FaqSection } from "@/components/home/faq-section";
import { ContactNewsletterSection } from "@/components/home/newsletter-section";
import { SiteFooter } from "@/components/landing/site-footer";

export function HomePage() {
  return (
    <HomeUiProvider>
      <SkipToContent />
      <EmergencyBanner />
      <AnnouncementBanner />
      <NavigationBar />
      <main id="main-content">
        <HeroSection />
        <AboutSection />
        <StatsSection />
        <ChallengesSection />
        <ProblemStatementsSection />
        <TimelineSection />
        <RulesSection />
        <PrizePoolSection />
        <MentorsSection />
        <FaqSection />
        <ContactNewsletterSection />
      </main>
      <SiteFooter />
    </HomeUiProvider>
  );
}
