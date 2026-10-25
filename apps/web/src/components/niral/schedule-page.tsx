'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Users,
  Calendar,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { ScheduleCalendarArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function SchedulePage() {
  const [activeDay, setActiveDay] = useState<1 | 2>(1);

  const eventInfo = [
    { icon: Calendar, label: 'December 3–4, 2026', sub: 'Thu – Fri' },
    {
      icon: MapPin,
      label: 'Sri Shakthi Institute of Engineering and Technology',
      sub: 'Coimbatore, Tamil Nadu',
    },
    { icon: Users, label: 'Offline Event', sub: 'On-campus' },
  ];

  // Per the master prompt, the mock's exact hours are NOT authorized facts.
  // Show confirmed day-level info with TBA times.
  const day1Sessions = [
    {
      time: 'Morning',
      title: 'Registrations & Check-in',
      description: 'Collect your kit, meet fellow innovators, and get set!',
      venue: 'Main Lobby',
    },
    {
      time: 'Morning',
      title: 'Inauguration Ceremony',
      description: 'Welcome address and event kickoff.',
      venue: 'Auditorium',
    },
    {
      time: 'Morning',
      title: 'Problem Statement Release',
      description: 'Explore problem statements across all tracks.',
      venue: 'Auditorium',
    },
    {
      time: 'Late Morning',
      title: 'Team Formation & Networking',
      description: 'Find your team, brainstorm ideas, and connect.',
      venue: 'Discussion Area',
    },
    {
      time: 'Afternoon',
      title: 'Lunch Break',
      description: 'Refuel and get ready to build!',
      venue: 'Dining Hall',
    },
    {
      time: 'Afternoon',
      title: 'Technical Session',
      description: 'Insights from industry experts.',
      venue: 'Auditorium',
    },
    {
      time: 'Afternoon – Night',
      title: 'Hacking Hours Begin',
      description: 'Turn ideas into reality. Mentors will be around!',
      venue: 'Hackathon Arena',
    },
  ];

  const day2Sessions = [
    {
      time: 'Early Morning',
      title: 'Hacking Continues',
      description: 'Continue building your projects with mentor support.',
      venue: 'Hackathon Arena',
    },
    {
      time: 'Morning',
      title: 'Submission Deadline',
      description: 'Final code freeze and project submission.',
      venue: 'Online Portal',
    },
    {
      time: 'Late Morning',
      title: 'Project Presentations',
      description: 'Demo your solution to the judging panel.',
      venue: 'Auditorium',
    },
    {
      time: 'Afternoon',
      title: 'Judging & Evaluation',
      description: 'Judges review and score all submissions.',
      venue: 'Judging Rooms',
    },
    {
      time: 'Afternoon',
      title: 'Awards & Closing Ceremony',
      description: 'Winners announced, prizes distributed, and farewell.',
      venue: 'Auditorium',
    },
  ];

  const sessions = activeDay === 1 ? day1Sessions : day2Sessions;

  const keyHighlights = [
    'Problem statements reveal',
    'Expert keynote sessions',
    'Team formation support',
    '24 hours of building',
  ];

  return (
    <PublicPageShell activeRoute="/schedule">
      {/* Hero */}
      <section className={publicStyles.heroSection} aria-labelledby="schedule-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            NIRAL 2026 · EVENT SCHEDULE
          </div>
          <h1 id="schedule-title" className={publicStyles.heroHeading}>
            Event
            <br />
            <mark>Schedule</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Two days of ideas, innovation, collaboration and hands-on building.
            Here&apos;s everything that&apos;s happening at NIRAL Hackathon 2026.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/register">
              Register Now <ArrowRight size={18} />
            </PopButton>
          </div>
        </div>
        <ScheduleCalendarArt />
      </section>

      {/* Event Info Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
          margin: '10px 0 40px',
        }}
      >
        {eventInfo.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={publicStyles.tactileCard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 20px',
              }}
            >
              <Icon size={22} color="#111" />
              <div>
                <strong style={{ fontSize: 14, display: 'block' }}>{item.label}</strong>
                <span style={{ fontSize: 12, color: '#666' }}>{item.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 36,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveDay(1)}
          style={{
            padding: '16px 24px',
            border: '2px solid #111',
            borderRadius: 12,
            background: activeDay === 1 ? 'var(--niral-coral, #fd9b9b)' : '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: activeDay === 1 ? '0 4px 0 #111' : '0 3px 0 #111',
            transition: 'all 0.15s ease',
            textAlign: 'center',
          }}
          aria-pressed={activeDay === 1}
        >
          <strong>Day 1</strong>
          <br />
          <span style={{ fontSize: 13, fontWeight: 500, color: activeDay === 1 ? '#111' : '#666' }}>
            December 3, 2026 (Thursday)
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveDay(2)}
          style={{
            padding: '16px 24px',
            border: '2px solid #111',
            borderRadius: 12,
            background: activeDay === 2 ? 'var(--niral-coral, #fd9b9b)' : '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: activeDay === 2 ? '0 4px 0 #111' : '0 3px 0 #111',
            transition: 'all 0.15s ease',
            textAlign: 'center',
          }}
          aria-pressed={activeDay === 2}
        >
          <strong>Day 2</strong>
          <br />
          <span style={{ fontSize: 13, fontWeight: 500, color: activeDay === 2 ? '#111' : '#666' }}>
            December 4, 2026 (Friday)
          </span>
        </button>
      </div>

      {/* Day Schedule + Sidebar */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 32,
          margin: '0 0 60px',
          alignItems: 'start',
        }}
      >
        {/* Timeline */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={publicStyles.eyebrowDot} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: '#666' }}>
                DAY {activeDay}
              </span>
            </div>
            <h2 className={publicStyles.sectionTitle}>
              {activeDay === 1
                ? <>Ideate. Collaborate. <mark>Begin.</mark></>
                : <>Build. Present. <mark>Win.</mark></>}
            </h2>
            <p className={publicStyles.sectionSubtitle}>
              {activeDay === 1
                ? 'Kickstart your NIRAL journey with inspiring sessions, team formation, and the beginning of an exciting build.'
                : 'Finish building, polish your demo, present to judges, and celebrate the results.'}
            </p>
          </div>

          {/* Session cards as a timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            {/* Vertical line */}
            <div
              style={{
                position: 'absolute',
                left: 56,
                top: 12,
                bottom: 12,
                width: 2,
                background: '#e0dedb',
                zIndex: 0,
              }}
            />

            {sessions.map((session, idx) => (
              <div
                key={session.title}
                className={publicStyles.tactileCard}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 12px 1fr auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '14px 20px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#555',
                    textAlign: 'right',
                  }}
                >
                  {session.time}
                </span>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: idx === 0 ? 'var(--niral-coral, #fd9b9b)' : '#e0dedb',
                    border: '2px solid #111',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <strong style={{ fontSize: 15, display: 'block', lineHeight: 1.3 }}>
                    {session.title}
                  </strong>
                  <span style={{ fontSize: 12.5, color: '#666' }}>
                    {session.description}
                  </span>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'var(--niral-soft-coral, #ffe2db)',
                    border: '1px solid #111',
                    borderRadius: 6,
                    padding: '3px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MapPin size={11} />
                  {session.venue}
                </span>
              </div>
            ))}

            <p
              style={{
                fontSize: 12,
                color: '#888',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              Exact session timings will be confirmed by organizers closer to the event.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key Highlights Card */}
          <div
            className={publicStyles.tactileCard}
            style={{ padding: 24 }}
          >
            <h3
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ✦ Key Highlights
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {keyHighlights.map((h) => (
                <li
                  key={h}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: '#d4f5d4',
                      border: '1.2px solid #111',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Venue Card */}
          <div
            className={publicStyles.tactileCardPeach}
            style={{ padding: 24 }}
          >
            <h3
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MapPin size={20} /> Venue
            </h3>
            <div
              style={{
                background: '#faf7f2',
                border: '1.5px solid #111',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                Sri Shakthi Institute of Engineering and Technology
              </strong>
              <p style={{ fontSize: 12.5, color: '#555', margin: 0 }}>
                L&amp;T Bypass, Chinniyampalayam, Coimbatore, Tamil Nadu – 641062.
              </p>
            </div>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 14,
                fontSize: 13,
                fontWeight: 700,
                color: '#111',
              }}
            >
              Get Directions <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={publicStyles.bottomBanner}>
        <div className={publicStyles.bottomBannerText}>
          <p style={{ fontSize: 15, color: '#555', margin: '0 0 4px 0' }}>
            Be part of two extraordinary days.
          </p>
          <h2 className={publicStyles.bottomBannerHeading}>
            Ready to <mark>build what matters?</mark>
          </h2>
        </div>
        <div className={publicStyles.bottomBannerAction}>
          <PopButton href="/register">
            Register Now <ArrowRight size={18} />
          </PopButton>
          <span className={publicStyles.bannerSubnote}>Join NIRAL Hackathon 2026</span>
        </div>
      </section>
    </PublicPageShell>
  );
}
