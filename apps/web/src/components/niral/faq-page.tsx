'use client';

import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Grid3X3,
  User,
  FileText,
  Users,
  Code2,
  Award,
  Calendar,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { FaqQuestionsArt } from './art-components';
import publicStyles from './public-pages.module.css';

interface FaqEntry {
  num: number;
  q: string;
  a: string;
  category: string;
}

const popularSearches = ['Registration', 'Team', 'Tracks', 'Eligibility', 'Prizes'];

const categoryTabs = [
  { name: 'All Questions', icon: Grid3X3 },
  { name: 'General', icon: User },
  { name: 'Registration', icon: FileText },
  { name: 'Teams', icon: Users },
  { name: 'Tracks & Problems', icon: Code2 },
  { name: 'Judging & Prizes', icon: Award },
  { name: 'Event & Logistics', icon: Calendar },
];

const allFaqs: FaqEntry[] = [
    {
      num: 1,
      q: 'What is NIRAL Hackathon 2026?',
      a: 'NIRAL Hackathon 2026 is an innovation-driven IoT and emerging technologies hackathon organized by the IoT Club at Sri Shakthi Institute of Engineering and Technology. It brings together students, innovators, and problem-solvers to build real-world solutions over two days (December 3–4, 2026).',
      category: 'General',
    },
    {
      num: 2,
      q: 'Who can participate?',
      a: 'NIRAL is open to students (undergraduate, postgraduate, research scholars), early professionals, and anyone passionate about technology and innovation. Participants from any college, organization, or background are welcome.',
      category: 'General',
    },
    {
      num: 3,
      q: 'How do I register?',
      a: 'Create an account on the official NIRAL Hackathon website, complete your profile, and submit your application when registration opens. You will receive updates about the registration timeline via email and on the Updates page.',
      category: 'Registration',
    },
    {
      num: 4,
      q: 'Can I participate in a team?',
      a: 'The event configuration specifies teams of 2–4 members. Check the Rules page for participation guidance.',
      category: 'Teams',
    },
    {
      num: 5,
      q: 'What are the problem statements about?',
      a: 'Problem statements cover real-world challenges across domains like IoT, AI/ML, sustainability, healthcare, smart cities, and education. Official problem statements will be released by the organizing team ahead of the hackathon.',
      category: 'Tracks & Problems',
    },
    {
      num: 6,
      q: 'How many team members are allowed?',
      a: 'The event configuration specifies 2–4 members per team. Solo participation and team composition exceptions have not been confirmed.',
      category: 'Teams',
    },
    {
      num: 7,
      q: 'Is there a registration fee?',
      a: 'Registration fee details will be confirmed by the organizers. Check the Updates page and your registered email for official announcements.',
      category: 'Registration',
    },
    {
      num: 8,
      q: 'What is the event format and timeline?',
      a: 'NIRAL Hackathon 2026 is a two-day, on-campus event at Sri Shakthi Institute of Engineering and Technology on December 3–4, 2026. The detailed schedule with exact session timings will be published on the Schedule page.',
      category: 'Event & Logistics',
    },
    {
      num: 9,
      q: 'What are the prizes and recognitions?',
      a: 'Prize details, including categories, amounts, and special recognitions, will be announced by the organizers. Stay tuned to the Updates page for official announcements.',
      category: 'Judging & Prizes',
    },
    {
      num: 10,
      q: 'Whom can I contact for further queries?',
      a: 'For any questions, contact the organizing team at iotclub.siet@gmail.com or call +91 8508511975. You can also visit the Contact page for more options.',
      category: 'General',
    },
];

export function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Questions');
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesSearch =
        searchQuery === '' ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All Questions' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <PublicPageShell activeRoute="/faq">
      {/* Hero */}
      <section className={publicStyles.heroSection} aria-labelledby="faq-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            SUPPORT · NIRAL 2026
          </div>
          <h1 id="faq-title" className={publicStyles.heroHeading}>
            Frequently
            <br />
            Asked
            <br />
            <mark>Questions</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Find clear answers to the most common questions about NIRAL Hackathon
            2026. Everything you need to know, all in one place.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, maxWidth: 500 }}>
            <div className={publicStyles.searchBox} style={{ flex: 1 }}>
              <Search size={18} color="#777" />
              <input
                type="text"
                placeholder="Search for questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search FAQs"
              />
            </div>
            <PopButton
              onClick={() => {
                document.getElementById('faq-results')?.focus();
              }}
            >
              Search
            </PopButton>
          </div>

          {/* Popular searches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Popular searches:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                style={{
                  padding: '4px 12px',
                  border: '1px solid #d0ccc5',
                  borderRadius: 20,
                  background: '#fff',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <FaqQuestionsArt />
      </section>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 36,
          borderBottom: '2px solid #e6e3df',
          paddingBottom: 0,
        }}
      >
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.name;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => setActiveCategory(tab.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--niral-coral, #fd9b9b)' : '3px solid transparent',
                background: 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: isActive ? '#111' : '#666',
                transition: 'all 0.15s ease',
              }}
              aria-pressed={isActive}
            >
              <Icon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion Grid */}
      <section id="faq-results" tabIndex={-1} style={{ margin: '0 0 60px' }}>
        <div style={{ marginBottom: 28 }}>
          <span className={publicStyles.sectionEyebrow}>COMMON QUESTIONS</span>
          <h2 className={publicStyles.sectionTitle}>
            Everything you <mark>need to know.</mark>
          </h2>
        </div>

        {filteredFaqs.length === 0 ? (
          <div
            className={publicStyles.tactileCard}
            style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}
          >
            <Search size={36} color="#ccc" style={{ marginBottom: 12 }} />
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' }}>
              No matching questions
            </h3>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px 0' }}>
              Try a different search term or browse all categories.
            </p>
            <PopButton onClick={() => { setSearchQuery(''); setActiveCategory('All Questions'); }} cream>
              Show All Questions
            </PopButton>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: 14,
            }}
          >
            {filteredFaqs.map((faq) => {
              const isOpen = openQuestion === faq.num;
              return (
                <div
                  key={faq.num}
                  className={publicStyles.tactileCard}
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : faq.num)}
                    aria-expanded={isOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 14,
                      width: '100%',
                      padding: '16px 20px',
                      border: 'none',
                      background: isOpen ? 'var(--niral-soft-coral, #ffe2db)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          minWidth: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isOpen ? 'var(--niral-coral, #fd9b9b)' : '#faf7f2',
                          border: '1.5px solid #111',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {String(faq.num).padStart(2, '0')}
                      </span>
                      <strong style={{ fontSize: 14.5 }}>{faq.q}</strong>
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px 64px',
                        fontSize: 14,
                        color: '#555',
                        lineHeight: 1.55,
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Still Need Help CTA */}
      <section
        className={publicStyles.bottomBanner}
        style={{
          background: 'var(--niral-soft-coral, #ffe2db)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: '#fff',
              border: '2.5px solid #111',
              boxShadow: '0 4px 0 #111',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 36 }}>🤖</span>
          </div>
          <div>
            <span className={publicStyles.bottomBannerEyebrow}>
              STILL NEED HELP?
            </span>
            <h2 className={publicStyles.bottomBannerHeading}>
              We&apos;re here <mark>for you.</mark>
            </h2>
            <p className={publicStyles.bottomBannerSubtext}>
              Can&apos;t find what you&apos;re looking for? Reach out to our team
              and we&apos;ll get back to you as soon as possible.
            </p>
            <PopButton href="/contact" style={{ marginTop: 14 }}>
              <Mail size={16} /> Contact Us <ArrowRight size={16} />
            </PopButton>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={18} color="#111" />
            <div>
              <strong style={{ fontSize: 13.5, display: 'block' }}>Email Us</strong>
              <a href="mailto:iotclub.siet@gmail.com" style={{ fontSize: 12.5, color: '#555' }}>
                iotclub.siet@gmail.com
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={18} color="#111" />
            <div>
              <strong style={{ fontSize: 13.5, display: 'block' }}>Call Us</strong>
              <a href="tel:+918508511975" style={{ fontSize: 12.5, color: '#555' }}>
                +91 8508511975
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={18} color="#111" />
            <div>
              <strong style={{ fontSize: 13.5, display: 'block' }}>Visit Us</strong>
              <span style={{ fontSize: 12.5, color: '#555' }}>
                Sri Shakthi Institute of Engineering and Technology
              </span>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
