'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Play,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Globe,
  Plus,
  Minus,
  Sparkles,
  Compass,
  UserPlus,
  FileText,
  BarChart2,
  Mail,
  User,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { ParticipateHeroArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function ParticipatePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Quick form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const journeySteps = [
    {
      num: 1,
      title: 'Explore the Event',
      desc: 'Learn about themes, tracks, prizes and everything NIRAL has to offer.',
      icon: Compass,
      href: '/about',
      actionText: 'Explore Themes & Tracks',
    },
    {
      num: 2,
      title: 'Create Account',
      desc: 'Sign up on our platform with your basic details.',
      icon: UserPlus,
      href: '/register',
      actionText: 'Go to Registration',
    },
    {
      num: 3,
      title: 'Apply for the Hackathon',
      desc: 'Form a team or join one, choose your track and submit your application.',
      icon: FileText,
      href: '/dashboard/enrollment',
      actionText: 'View Enrollment',
    },
    {
      num: 4,
      title: 'Track Your Status',
      desc: 'Keep an eye on your application, important updates and next steps.',
      icon: BarChart2,
      href: '/dashboard',
      actionText: 'Go to Dashboard',
    },
  ];

  const eligibilityCards = [
    {
      title: 'Students',
      desc: 'Undergraduate, postgraduate or research scholars.',
      icon: GraduationCap,
    },
    {
      title: 'Professionals',
      desc: 'Engineers, designers, product managers and domain experts.',
      icon: Briefcase,
    },
    {
      title: 'Innovators',
      desc: 'Anyone with a passion for building real solutions.',
      icon: Lightbulb,
    },
    {
      title: 'Open to All',
      desc: 'Participants from any college, organization or independent.',
      icon: Globe,
    },
  ];

  const faqs = [
    {
      q: 'Is there a registration fee?',
      a: 'Registration fee details will be confirmed by the organizers. Check the Updates page for official announcements.',
    },
    {
      q: 'Can I participate in a team?',
      a: 'The event configuration specifies teams of 2–4 members. Solo participation has not been confirmed.',
    },
    {
      q: 'What is the eligibility criteria?',
      a: 'Open to all students, professionals and innovators from any background.',
    },
    {
      q: 'How will I know if I’m selected?',
      a: 'You will be notified via email and your dashboard on our website.',
    },
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setFormMsg('Please provide your name and email.');
      return;
    }
    try {
      const [firstName, ...lastParts] = fullName.trim().split(/\s+/);
      sessionStorage.setItem(
        'hackos.register.draft',
        JSON.stringify({
          firstName,
          lastName: lastParts.join(' '),
          email,
        }),
      );
      router.push('/register');
    } catch {
      router.push('/register');
    }
  };

  return (
    <PublicPageShell activeRoute="/participate">
      <p className={publicStyles.tactileCardPeach}>Create an account to prepare your profile. Event registration availability and fees await organizer confirmation; an account does not confirm enrollment.</p>
      {/* Hero Section */}
      <section className={publicStyles.heroSection} aria-labelledby="participate-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            JOIN NIRAL 2026
          </div>
          <h1 id="participate-title" className={publicStyles.heroHeading}>
            How to
            <br />
            <mark>Participate</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Turn your ideas into real-world solutions. Follow a simple process,
            collaborate with like-minded innovators, and be part of NIRAL
            Hackathon 2026.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/register">
              Create Account <ArrowRight size={18} />
            </PopButton>
            <PopButton href="#journey" cream>
              <Play size={16} /> Watch Guide
            </PopButton>
          </div>
        </div>
        <ParticipateHeroArt />
      </section>

      {/* Participation Journey */}
      <section id="journey" style={{ margin: '50px 0 60px' }}>
        <div style={{ marginBottom: 36 }}>
          <h2 className={publicStyles.sectionTitle}>Your Participation Journey</h2>
          <p className={publicStyles.sectionSubtitle}>
            From curiosity to impact — here’s how you can be a part of NIRAL 2026.
          </p>
        </div>

        {/* 4 Steps Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: 20,
            position: 'relative',
          }}
        >
          {journeySteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className={isSelected ? publicStyles.tactileCardPeach : publicStyles.tactileCardCream}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
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
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--niral-coral, #fd9b9b)',
                        border: '1.5px solid #111',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {step.num}
                    </div>
                    <Icon size={20} color="#111" />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 18,
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#555', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                    {step.desc}
                  </p>
                </div>

                <Link
                  href={step.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#111',
                  }}
                >
                  {step.actionText} <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Columns: Who Can Participate + Quick Account Form */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 36,
          alignItems: 'start',
          margin: '60px 0',
        }}
      >
        {/* Left: Who Can Participate */}
        <div>
          <h2 className={publicStyles.sectionTitle}>Who Can Participate?</h2>
          <p className={publicStyles.sectionSubtitle} style={{ marginBottom: 28 }}>
            NIRAL is open to passionate problem-solvers from diverse backgrounds
            who are excited about IoT and emerging technologies.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 16,
            }}
          >
            {eligibilityCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={publicStyles.tactileCard}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
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
                  <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.4 }}>
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Create Your Account card */}
        <div className={publicStyles.tactileCard} style={{ padding: 28, background: '#faf7f2' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 24,
                  fontWeight: 700,
                  margin: '0 0 4px 0',
                }}
              >
                Create Your Account
              </h3>
              <p style={{ fontSize: 13.5, color: '#666', margin: 0 }}>
                Get started in less than a minute.
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'var(--niral-coral, #fd9b9b)',
                border: '1.5px solid #111',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              Start Your Account ⚡
            </span>
          </div>

          <form onSubmit={handleQuickSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="participate-name" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                Full Name
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: '2px solid #111',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <User size={16} color="#777" />
                <input
                  type="text"
                  id="participate-name" autoComplete="name" placeholder="e.g. Priyanshu Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="participate-email" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                Email Address
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: '2px solid #111',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <Mail size={16} color="#777" />
                <input
                  type="email"
                  id="participate-email" autoComplete="email" placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
                />
              </div>
            </div>

            {formMsg && (
              <p style={{ color: '#d32f2f', fontSize: 12, margin: 0 }}>{formMsg}</p>
            )}

            <PopButton type="submit" style={{ marginTop: 8 }}>
              Create Account <ArrowRight size={16} />
            </PopButton>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
                fontSize: 12,
                color: '#666',
              }}
            >
              <Sparkles size={15} color="#fd9b9b" />
              <span>Account creation is separate from event enrollment. Check Updates for registration availability.</span>
            </div>
          </form>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ margin: '60px 0' }}>
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
            <h2 className={publicStyles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={publicStyles.sectionSubtitle}>
              Quick answers to help you get started.
            </p>
          </div>
          <Link
            href="/faq"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: 14,
              color: '#111',
            }}
          >
            View All FAQs <ArrowRight size={16} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 18,
          }}
        >
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className={publicStyles.tactileCard}
                style={{ cursor: 'pointer', padding: 20 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 15.5,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {faq.q}
                  </h3>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      border: '1.2px solid #111',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                  </div>
                </div>
                {isOpen && (
                  <p style={{ fontSize: 13.5, color: '#555', marginTop: 12, marginBottom: 0, lineHeight: 1.45 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className={publicStyles.bottomBanner}>
        <div className={publicStyles.bottomBannerText}>
          <span className={publicStyles.bottomBannerEyebrow}>
            BE A PART OF NIRAL 2026
          </span>
          <h2 className={publicStyles.bottomBannerHeading}>
            Ready to build <mark>what matters?</mark>
          </h2>
          <p className={publicStyles.bottomBannerSubtext}>
            Join a community of innovators, solve real-world problems, and make an
            impact with IoT and emerging technologies.
          </p>
        </div>

        <div className={publicStyles.heroActions}>
          <PopButton href="/register">
            Create Account <ArrowRight size={18} />
          </PopButton>
          <PopButton href="/about" cream>
            Learn More
          </PopButton>
        </div>
      </section>
    </PublicPageShell>
  );
}
