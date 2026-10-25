'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Calendar,
  Megaphone,
  Send,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { UpdatesNoticeBoardArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function UpdatesPage() {
  const [activeFilter, setActiveFilter] = useState('All Updates');

  const categoryFilters = ['All Updates', 'Announcements', 'Schedule', 'Participation', 'General'];

  // Use seed announcements from the content store as a starting point.
  // These are confirmed factual announcements, not mock data.
  const announcements = [
    {
      id: 'u1',
      title: 'NIRAL Hackathon 2026 dates confirmed',
      body: 'December 3–4, 2026 at Sri Shakthi Institute of Engineering and Technology. Mark your calendars!',
      category: 'Announcements',
      priority: 'important' as const,
      date: 'Confirmed',
    },
    {
      id: 'u2',
      title: 'Organized by IoT Club',
      body: 'NIRAL Hackathon 2026 is officially organized by the IoT Club, Sri Shakthi Institute of Engineering and Technology. Contact: iotclub.siet@gmail.com',
      category: 'General',
      priority: 'normal' as const,
      date: 'Confirmed',
    },
    {
      id: 'u3',
      title: 'Problem statements & tracks coming soon',
      body: 'Official challenge releases and innovation tracks will be published ahead of the event. Stay tuned for updates.',
      category: 'Announcements',
      priority: 'normal' as const,
      date: 'Coming Soon',
    },
  ];

  const filteredAnnouncements = announcements.filter(
    (a) => activeFilter === 'All Updates' || a.category === activeFilter,
  );

  const keyDates = [
    { label: 'Event Dates', value: 'Dec 3–4, 2026' },
    { label: 'Venue', value: 'Sri Shakthi Institute' },
    { label: 'Registration', value: 'Opening Soon' },
    { label: 'Problem Statements', value: 'Coming Soon' },
  ];

  return (
    <PublicPageShell activeRoute="/updates">
      {/* Hero */}
      <section className={publicStyles.heroSection} aria-labelledby="updates-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            ANNOUNCEMENTS · NIRAL 2026
          </div>
          <h1 id="updates-title" className={publicStyles.heroHeading}>
            Official
            <br />
            <mark>Updates.</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Stay informed with the latest announcements, important dates, and
            everything you need to know about NIRAL Hackathon 2026.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/contact">
              <Bell size={16} /> Stay Informed <ArrowRight size={18} />
            </PopButton>
            <PopButton href="/schedule" cream>
              <Send size={16} /> View Schedule
            </PopButton>
          </div>
        </div>
        <UpdatesNoticeBoardArt />
      </section>

      {/* Explore Updates with category chips */}
      <section style={{ margin: '40px 0 60px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 28,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2 className={publicStyles.sectionTitle}>Explore Updates</h2>
            <p className={publicStyles.sectionSubtitle}>
              Filter by category to find the information you need.
            </p>
          </div>
          <div className={publicStyles.chipGroup}>
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`${publicStyles.filterChip} ${
                  activeFilter === cat ? publicStyles.filterChipActive : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Announcement Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {filteredAnnouncements.map((item) => (
            <div key={item.id} className={publicStyles.tactileCard} style={{ padding: 22 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background:
                      item.priority === 'important'
                        ? 'var(--niral-coral, #fd9b9b)'
                        : 'var(--niral-soft-coral, #ffe2db)',
                    border: '1px solid #111',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.category}
                </span>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{item.date}</span>
              </div>

              <h3
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  lineHeight: 1.25,
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {item.body}
              </p>

              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  border: '1.5px solid #111',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <ArrowRight size={15} color="#111" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Updates Feed & Sidebar */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 32,
          margin: '60px 0',
          alignItems: 'start',
        }}
      >
        {/* Left: Feed */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2 className={publicStyles.sectionTitle}>Latest Updates</h2>
          </div>
          <p className={publicStyles.sectionSubtitle} style={{ marginBottom: 24 }}>
            A chronological feed of all announcements and updates.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {announcements.map((item, idx) => (
              <div
                key={item.id}
                className={publicStyles.tactileCard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: idx === 0 ? 'var(--niral-coral, #fd9b9b)' : 'var(--niral-soft-coral, #ffe2db)',
                    border: '1.5px solid #111',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {idx === 0 ? <Megaphone size={18} color="#111" /> : <Calendar size={18} color="#111" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 14.5 }}>{item.title}</strong>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background:
                          item.priority === 'important'
                            ? 'var(--niral-coral, #fd9b9b)'
                            : '#e0dedb',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{item.body}</p>
                </div>
                <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stay Informed Card */}
          <div className={publicStyles.tactileCard} style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Bell size={20} />
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, margin: 0 }}>
                Never Miss an Update!
              </h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#555', marginBottom: 16 }}>
              Get important announcements, deadline reminders and event news.
              Create an account to receive notifications.
            </p>
            <PopButton href="/register">
              Create Account <ArrowRight size={16} />
            </PopButton>
            <p style={{ fontSize: 11, color: '#888', marginTop: 10 }}>
              ⓘ We&apos;ll only send important updates. No spam, ever.
            </p>
          </div>

          {/* Key Dates Card */}
          <div className={publicStyles.tactileCardPeach} style={{ padding: 24 }}>
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
              <Calendar size={18} />
              Key Dates
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {keyDates.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--niral-coral, #fd9b9b)',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <span style={{ color: '#666' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={publicStyles.bottomBanner} style={{ background: '#111', color: '#fff' }}>
        <div className={publicStyles.bottomBannerText}>
          <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: '#fd9b9b', textTransform: 'uppercase' }}>
            STAY IN THE LOOP
          </span>
          <h2
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700,
              margin: '6px 0 6px 0',
              color: '#fff',
            }}
          >
            Be the <mark style={{ background: 'var(--niral-soft-coral, #ffe2db)', color: '#111' }}>first</mark> to know.
          </h2>
          <p style={{ fontSize: 14, color: '#bbb', margin: 0 }}>
            Get the latest announcements, deadlines and updates about NIRAL 2026.
          </p>
        </div>
        <PopButton href="/register">
          Subscribe for Updates <ArrowRight size={18} />
        </PopButton>
      </section>
    </PublicPageShell>
  );
}
