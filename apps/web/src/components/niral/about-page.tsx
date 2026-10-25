'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Lightbulb,
  Users,
  Cpu,
  Trophy,
  Share2,
  Send,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { AboutHeroArt, AboutExperienceArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function AboutPage() {
  const pillars = [
    {
      num: '01',
      title: 'Imagine',
      icon: Lightbulb,
      description:
        "A space to think beyond boundaries, explore bold ideas, and reimagine what's possible with technology.",
      href: '/tracks',
    },
    {
      num: '02',
      title: 'Collaborate',
      icon: Users,
      description:
        'Work with diverse minds, share perspectives, and build together in a supportive, open community.',
      href: '/participate',
    },
    {
      num: '03',
      title: 'Create',
      icon: Cpu,
      description:
        'Turn ideas into working solutions that solve real problems and create meaningful impact.',
      href: '/problems',
    },
  ];

  const experiencePoints = [
    {
      title: 'Hands-on Learning',
      desc: 'Gain practical experience with real-world technologies.',
      Icon: Users,
    },
    {
      title: 'Mentorship & Guidance',
      desc: 'Learn from industry experts and innovators.',
      Icon: Lightbulb,
    },
    {
      title: 'Networking Opportunities',
      desc: 'Meet like-minded peers, build connections, and grow your community.',
      Icon: Share2,
    },
    {
      title: 'Real-World Impact',
      desc: 'Create solutions that address today’s challenges and shape a better tomorrow.',
      Icon: Trophy,
    },
  ];

  return (
    <PublicPageShell activeRoute="/about">
      {/* Hero Section */}
      <section className={publicStyles.heroSection} aria-labelledby="about-hero-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            NIRAL 2026 · ABOUT
          </div>
          <h1 id="about-hero-title" className={publicStyles.heroHeading}>
            <mark>More than a</mark>
            <br />
            hackathon.
          </h1>
          <p className={publicStyles.heroSubtitle}>
            NIRAL Hackathon 2026 is a space for curious minds to explore ideas,
            work together, and create meaningful solutions through IoT and
            emerging technologies.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/participate">
              How to participate <ArrowRight size={18} />
            </PopButton>
            <PopButton href="/tracks" cream>
              <Play size={16} /> Explore the event
            </PopButton>
          </div>
        </div>
        <AboutHeroArt />
      </section>

      {/* The Idea Behind NIRAL */}
      <section style={{ margin: '48px 0 60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            alignItems: 'end',
            marginBottom: 36,
          }}
        >
          <div>
            <span className={publicStyles.sectionEyebrow}>THE IDEA BEHIND NIRAL</span>
            <h2 className={publicStyles.sectionTitle}>
              Driven by curiosity.
              <br />
              Built for a <mark>better tomorrow.</mark>
            </h2>
          </div>
          <p className={publicStyles.sectionSubtitle}>
            NIRAL brings together students, innovators, and problem-solvers to
            explore the real potential of IoT and emerging technologies — turning
            ideas into impactful, real-world solutions.
          </p>
        </div>

        {/* 3 Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 22,
          }}
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className={publicStyles.tactileCard}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      border: '2px solid #111',
                      borderRadius: 12,
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon size={26} color="#111" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>
                    {pillar.num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 22,
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                  }}
                >
                  {pillar.title}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    color: '#555',
                    lineHeight: 1.5,
                    marginBottom: 20,
                    minHeight: 66,
                  }}
                >
                  {pillar.description}
                </p>
                <Link
                  href={pillar.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--niral-coral, #fd9b9b)',
                    border: '1.5px solid #111',
                    boxShadow: '0 2px 0 #111',
                  }}
                  aria-label={`Learn more about ${pillar.title}`}
                >
                  <ArrowRight size={17} color="#111" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* The NIRAL Experience */}
      <section style={{ margin: '60px 0' }}>
        <div style={{ marginBottom: 36 }}>
          <span className={publicStyles.sectionEyebrow}>THE NIRAL EXPERIENCE</span>
          <h2 className={publicStyles.sectionTitle}>
            An event that
            <br />
            inspires, builds
            <br />
            and <mark>connects.</mark>
          </h2>
          <p className={publicStyles.sectionSubtitle}>
            NIRAL is more than a competition. It’s a dynamic experience designed
            to help you learn, build, network, and grow — surrounded by a
            community that believes in the power of ideas.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <AboutExperienceArt />

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {experiencePoints.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.title}
                  className={publicStyles.tactileCard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '18px 22px',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      border: '1.8px solid #111',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} color="#111" />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: 17,
                        fontWeight: 700,
                        margin: '0 0 3px 0',
                      }}
                    >
                      {item.title}
                    </h4>
                    <p style={{ fontSize: 13.5, color: '#555', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className={publicStyles.bottomBanner}>
        <div className={publicStyles.bottomBannerText}>
          <span className={publicStyles.bottomBannerEyebrow}>
            BE A PART OF NIRAL 2026
          </span>
          <h2 className={publicStyles.bottomBannerHeading}>
            Let&apos;s build what matters.
          </h2>
          <p className={publicStyles.bottomBannerSubtext}>
            Bring your ideas, skills, and curiosity. Be part of a community that
            turns ideas into impact.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              background: '#fff',
              border: '2px solid #111',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 3px 0 #111',
            }}
          >
            <Send size={28} color="#b85b5b" />
          </div>

          <div className={publicStyles.bottomBannerAction}>
            <PopButton href="/register">
              Register Now <ArrowRight size={18} />
            </PopButton>
            <span className={publicStyles.bannerSubnote}>Be a part of NIRAL 2026</span>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
