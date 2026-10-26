'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Play,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  User,
  Globe,
  Users,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Megaphone,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { RulesGuidelinesArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function RulesPage() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  const rulesAccordion = [
    {
      num: 1,
      title: 'Original Work Only',
      content:
        "All submissions must be your team's original work. Plagiarism, use of pre-built solutions without significant modification, or copying from existing products is strictly prohibited.",
    },
    {
      num: 2,
      title: 'Use of AI Tools',
      content:
        'The organizers have not published an AI tools policy. Confirm permitted tools and disclosure requirements before using them in your submission.',
    },
    {
      num: 3,
      title: 'Submission Guidelines',
      content:
        'All projects must be submitted via the official submission portal before the deadline. Late submissions will not be accepted. Each submission must include source code, documentation, and a demo video or live demonstration.',
    },
    {
      num: 4,
      title: 'Judging Criteria',
      content:
        'Projects are evaluated on innovation, technical depth, scalability, presentation quality, and real-world impact. Judges\' decisions are final. Detailed rubric weights will be shared before the evaluation round.',
    },
    {
      num: 5,
      title: 'Disqualification Rules',
      content:
        'Teams may be disqualified for plagiarism, misconduct, violating the code of conduct, submitting pre-existing work, or failing to adhere to organizer instructions. Appeals can be submitted to the organizing committee within 24 hours.',
    },
  ];

  const eligibilityCards = [
    {
      title: 'Students',
      desc: 'Undergraduate / Postgraduate students from any recognized institution.',
      icon: GraduationCap,
    },
    {
      title: 'Early Professionals',
      desc: 'Working professionals with up to 2 years of experience.',
      icon: User,
    },
    {
      title: 'Open to All',
      desc: 'Participants from across India. All disciplines are welcome!',
      icon: Globe,
    },
    {
      title: 'Team Participation',
      desc: 'The event configuration specifies teams of 2–4 members.',
      icon: Users,
    },
  ];

  const teamPolicies = [
    'Teams can have 2 to 4 members.',
    'Members can be from different colleges or disciplines.',
    'Each participant can be a part of only one team.',
    'Team changes are not allowed after the registration deadline.',
    'All team members must register on the official website.',
  ];

  const codeOfConduct = [
    'Be respectful, inclusive, and supportive.',
    'No hate speech, discrimination, or harassment.',
    'Maintain a professional and collaborative environment.',
    'Respect intellectual property and give due credit.',
    'Follow all instructions from organizers and mentors.',
  ];

  return (
    <PublicPageShell activeRoute="/rules">
      {/* Hero */}
      <section className={publicStyles.heroSection} aria-labelledby="rules-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            NIRAL 2026 · RULES & ELIGIBILITY
          </div>
          <h1 id="rules-title" className={publicStyles.heroHeading}>
            Rules &amp;
            <br />
            <mark>Eligibility</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            A fair, inclusive, and inspiring environment for everyone. Read the
            rules, check your eligibility, and get ready to build what matters.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/register">
              Create Account <ArrowRight size={18} />
            </PopButton>
            <PopButton href="/tracks" cream>
              <Play size={16} /> Explore Tracks
            </PopButton>
          </div>
        </div>
        <RulesGuidelinesArt />
      </section>
      <p className={publicStyles.tactileCardPeach}>Team size: 2–4 members per event configuration. Other eligibility, submission, judging and conduct guidance below is provisional pending organizer publication.</p>


      {/* Event Rules Accordion */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 36,
          margin: '50px 0 60px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 18,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={16} />
            EVENT RULES
          </div>
          <h2 className={publicStyles.sectionTitle}>
            Everything you
            <br />
            <mark>need to know.</mark>
          </h2>
          <p className={publicStyles.sectionSubtitle}>
            Please go through the following rules carefully. These ensure a fair,
            smooth, and meaningful experience for all participants.
          </p>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rulesAccordion.map((rule, idx) => {
            const isOpen = openAccordion === idx;
            return (
              <div
                key={rule.num}
                className={publicStyles.tactileCard}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenAccordion(isOpen ? null : idx)}
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
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: isOpen ? 'var(--niral-coral, #fd9b9b)' : '#faf7f2',
                        border: '1.5px solid #111',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {rule.num}
                    </span>
                    <strong style={{ fontSize: 15 }}>{rule.title}</strong>
                  </div>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 18px',
                      fontSize: 14,
                      color: '#555',
                      lineHeight: 1.55,
                    }}
                  >
                    {rule.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Eligibility */}
      <section style={{ margin: '60px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Users size={16} />
            ELIGIBILITY
          </div>
          <h2 className={publicStyles.sectionTitle}>
            Who can <mark>participate?</mark>
          </h2>
          <p className={publicStyles.sectionSubtitle}>
            NIRAL Hackathon 2026 is open to curious minds from diverse
            backgrounds who are excited to build, learn, and innovate.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 18,
          }}
        >
          {eligibilityCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={publicStyles.tactileCard}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--niral-soft-coral, #ffe2db)',
                    border: '1.8px solid #111',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Icon size={22} color="#111" />
                </div>
                <h3
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 17,
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                  }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: 13.5, color: '#555', margin: 0, lineHeight: 1.4 }}>
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Policy & Code of Conduct */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 28,
          margin: '60px 0',
        }}
      >
        {/* Team Policy */}
        <div className={publicStyles.tactileCard} style={{ padding: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Users size={16} />
            TEAM POLICY
          </div>
          <h3
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 26,
              fontWeight: 700,
              margin: '0 0 6px 0',
            }}
          >
            Build together,
            <br />
            <mark>grow together.</mark>
          </h3>

          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teamPolicies.map((policy) => (
              <li key={policy} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={18} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{policy}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Code of Conduct */}
        <div className={publicStyles.tactileCardPeach} style={{ padding: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Heart size={16} />
            CODE OF CONDUCT
          </div>
          <h3
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 26,
              fontWeight: 700,
              margin: '0 0 6px 0',
            }}
          >
            A respectful
            <br />
            and <mark>inclusive space.</mark>
          </h3>

          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {codeOfConduct.map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={18} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={publicStyles.bottomBanner} style={{ background: '#111', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--niral-coral, #fd9b9b)',
              border: '2px solid #fff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Megaphone size={28} color="#111" />
          </div>
          <div>
            <span style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: '#fd9b9b', textTransform: 'uppercase' }}>
              READY TO BUILD?
            </span>
            <h2
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(22px, 2.8vw, 30px)',
                fontWeight: 700,
                margin: '4px 0 4px 0',
                color: '#fff',
              }}
            >
              Be a part of NIRAL Hackathon 2026.
            </h2>
            <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
              Understand the rules, check your eligibility, and join a community
              that builds ideas for a better tomorrow.
            </p>
          </div>
        </div>
        <PopButton href="/register">
          Create Account <ArrowRight size={18} />
        </PopButton>
      </section>
    </PublicPageShell>
  );
}
