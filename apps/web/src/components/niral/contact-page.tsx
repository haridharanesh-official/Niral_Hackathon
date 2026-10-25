'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Compass,
  CalendarDays,
  Plus,
  Minus,
  MessageSquare,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { ContactMapArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function ContactPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);

  const copyToClipboard = (text: string, type: 'email' | 'phone' | 'venue') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'email') {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedVenue(true);
        setTimeout(() => setCopiedVenue(false), 2000);
      }
    }
  };

  const categories = [
    {
      title: 'Registration',
      description: 'Queries about team registration and eligibility.',
      href: 'mailto:iotclub.siet@gmail.com?subject=[NIRAL 2026] Registration Query',
      icon: HelpCircle,
    },
    {
      title: 'Event Schedule',
      description: 'Details about timeline, sessions and activities.',
      href: '/schedule',
      icon: Clock,
    },
    {
      title: 'Venue & Travel',
      description: 'Location, accommodation and travel information.',
      href: 'mailto:iotclub.siet@gmail.com?subject=[NIRAL 2026] Venue & Travel Inquiry',
      icon: MapPin,
    },
    {
      title: 'General Inquiry',
      description: 'Any other questions or support.',
      href: 'mailto:iotclub.siet@gmail.com?subject=[NIRAL 2026] General Inquiry',
      icon: MessageSquare,
    },
  ];

  return (
    <PublicPageShell activeRoute="/contact">
      {/* Hero Section */}
      <section className={publicStyles.heroSection} aria-labelledby="contact-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            GET IN TOUCH
          </div>

          <h1 id="contact-title" className={publicStyles.heroHeading}>
            Contact &amp; <mark>Venue</mark>
          </h1>

          <p className={publicStyles.heroSubtitle}>
            Have questions? We&apos;re here to help. Reach out to us or visit the venue for NIRAL
            Hackathon 2026. Let&apos;s build something meaningful together.
          </p>

          <div className={publicStyles.heroActions}>
            <PopButton href="/register">
              Register Now <ArrowRight size={16} />
            </PopButton>
            <Link href="/about" className={publicStyles.outlinedBtn}>
              <Compass size={16} /> Explore the Event
            </Link>
          </div>
        </div>

        <ContactMapArt />
      </section>

      {/* Section 1: Reach Us Directly */}
      <section style={{ padding: '48px 0' }} aria-labelledby="reach-title">
        <div className={publicStyles.eyebrow}>
          <span className={publicStyles.eyebrowDot} />
          CONTACT DETAILS
        </div>
        <h2 id="reach-title" className={publicStyles.sectionTitle}>
          Reach Us Directly
        </h2>
        <p className={publicStyles.sectionSubtitle}>
          For any queries, support, or collaboration opportunities, feel free to contact us through
          the following channels.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginTop: 32,
          }}
        >
          {/* Email Us */}
          <div
            className={publicStyles.tactileCard}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  border: '2px solid #111',
                  boxShadow: '0 3px 0 #111',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={24} color="#111" />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px 0', color: '#111' }}>
                  Email Us
                </h3>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.45 }}>
                  For general inquiries, registrations or support.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                borderRadius: 12,
                boxShadow: '0 3px 0 #111',
              }}
            >
              <a
                href="mailto:iotclub.siet@gmail.com"
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                iotclub.siet@gmail.com
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('iotclub.siet@gmail.com', 'email')}
                title="Copy email address"
                aria-label="Copy email"
                style={{
                  background: '#fff',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 2px 0 #111',
                }}
              >
                {copiedEmail ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Call Us */}
          <div
            className={publicStyles.tactileCard}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  border: '2px solid #111',
                  boxShadow: '0 3px 0 #111',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Phone size={24} color="#111" />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px 0', color: '#111' }}>
                  Call Us
                </h3>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.45 }}>
                  Speak directly with the organizing team.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                borderRadius: 12,
                boxShadow: '0 3px 0 #111',
              }}
            >
              <a
                href="tel:+918508511975"
                style={{
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                +91 8508511975
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard('+918508511975', 'phone')}
                title="Copy phone number"
                aria-label="Copy phone"
                style={{
                  background: '#fff',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 2px 0 #111',
                }}
              >
                {copiedPhone ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Event Venue */}
          <div
            className={publicStyles.tactileCard}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  border: '2px solid #111',
                  boxShadow: '0 3px 0 #111',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={24} color="#111" />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px 0', color: '#111' }}>
                  Event Venue
                </h3>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.45 }}>
                  NIRAL Hackathon 2026 will be held at the following location.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                borderRadius: 12,
                boxShadow: '0 3px 0 #111',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Sri Shakthi Institute of Engineering and Technology
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'Sri Shakthi Institute of Engineering and Technology, Coimbatore',
                    'venue'
                  )
                }
                title="Copy venue name"
                aria-label="Copy venue name"
                style={{
                  background: '#fff',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 2px 0 #111',
                  flexShrink: 0,
                }}
              >
                {copiedVenue ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copiedVenue ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Venue & Directions */}
      <section style={{ padding: '36px 0 54px' }} aria-labelledby="venue-directions-title">
        <div className={publicStyles.eyebrow}>
          <span className={publicStyles.eyebrowDot} />
          FIND US
        </div>
        <h2 id="venue-directions-title" className={publicStyles.sectionTitle}>
          Venue &amp; Directions
        </h2>
        <p className={publicStyles.sectionSubtitle}>
          NIRAL Hackathon 2026 will be held at Sri Shakthi Institute of Engineering and Technology.
          Find the location below and plan your visit.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(340px, 1.4fr)',
            gap: 28,
            marginTop: 32,
            alignItems: 'stretch',
          }}
        >
          {/* Venue Card */}
          <div
            className={publicStyles.tactileCard}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 24,
              padding: 32,
            }}
          >
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  border: '2px solid #111',
                  boxShadow: '0 3px 0 #111',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 20,
                }}
              >
                <MapPin size={28} color="#111" />
              </div>

              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 12px 0',
                  color: '#111',
                  lineHeight: 1.3,
                }}
              >
                Sri Shakthi Institute of Engineering and Technology
              </h3>

              <p
                style={{
                  fontSize: 15,
                  color: '#555',
                  lineHeight: 1.6,
                  margin: '0 0 24px 0',
                }}
              >
                L&amp;T Bypass, Chinniyampalayam (Post),
                <br />
                Coimbatore, Tamil Nadu – 641062, India
              </p>
            </div>

            <div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sri+Shakthi+Institute+of+Engineering+and+Technology+Coimbatore"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  background: 'var(--niral-coral, #fd9b9b)',
                  border: '2px solid #111',
                  borderRadius: 12,
                  boxShadow: '0 4px 0 #111',
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#111',
                  textDecoration: 'none',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}
              >
                Get Directions <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Interactive Visual Map Card */}
          <div
            className={publicStyles.tactileCard}
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              minHeight: 380,
              background: '#f4f0e8',
            }}
          >
            {/* Map Canvas SVG */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                viewBox="0 0 600 400"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `scale(${mapZoom})`,
                  transition: 'transform 0.25s ease-out',
                }}
              >
                {/* Background Roads / Terrain */}
                <rect width="600" height="400" fill="#f8f5ee" />
                <path
                  d="M0,120 Q200,100 400,150 T600,110"
                  fill="none"
                  stroke="#e6e1d5"
                  strokeWidth="24"
                />
                <path
                  d="M50,0 Q180,200 220,400"
                  fill="none"
                  stroke="#e6e1d5"
                  strokeWidth="20"
                />
                <path
                  d="M380,0 Q390,200 450,400"
                  fill="none"
                  stroke="#e6e1d5"
                  strokeWidth="16"
                />

                {/* Major Highway: NH 544 / L&T Bypass in Golden Yellow */}
                <path
                  d="M0,280 L200,310 L380,190 L600,80"
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="16"
                />
                <path
                  d="M0,280 L200,310 L380,190 L600,80"
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="1.5"
                  strokeDasharray="6,4"
                />

                {/* Highway badges */}
                <g transform="translate(180, 280) rotate(-22)">
                  <rect
                    x="-24"
                    y="-10"
                    width="48"
                    height="20"
                    rx="4"
                    fill="#fbbf24"
                    stroke="#111"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#111"
                  >
                    NH 544
                  </text>
                </g>
                <text
                  x="240"
                  y="340"
                  transform="rotate(35, 240, 340)"
                  fontSize="11"
                  fontWeight="600"
                  fill="#78716c"
                >
                  L&amp;T Bypass
                </text>

                {/* Chinniyampalayam Area marker */}
                <circle cx="360" cy="270" r="4" fill="#9ca3af" />
                <text
                  x="360"
                  y="290"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#57534e"
                >
                  Chinniyampalayam
                </text>

                {/* SIET Location Pin & Marker */}
                <g transform="translate(390, 160)">
                  {/* Ripple pulse animation */}
                  <circle cx="0" cy="0" r="18" fill="var(--niral-coral, #fd9b9b)" opacity="0.35" />
                  <circle cx="0" cy="0" r="9" fill="var(--niral-coral, #fd9b9b)" opacity="0.7" />

                  {/* Marker Pin Icon */}
                  <path
                    d="M0,-24 C-10,-24 -16,-16 -16,-7 C-16,4 0,22 0,22 C0,22 16,4 16,-7 C16,-16 10,-24 0,-24 Z"
                    fill="#ef4444"
                    stroke="#111"
                    strokeWidth="2.5"
                  />
                  <circle cx="0" cy="-9" r="5" fill="#fff" stroke="#111" strokeWidth="2" />
                </g>

                {/* Tooltip Card over SIET */}
                <g transform="translate(390, 105)">
                  <rect
                    x="-105"
                    y="-30"
                    width="210"
                    height="38"
                    rx="8"
                    fill="#fff"
                    stroke="#111"
                    strokeWidth="2"
                    filter="drop-shadow(0 3px 0 #111)"
                  />
                  <text
                    x="0"
                    y="-13"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#111"
                  >
                    Sri Shakthi Institute of
                  </text>
                  <text
                    x="0"
                    y="-1"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#111"
                  >
                    Engineering and Technology
                  </text>
                </g>
              </svg>

              {/* Map Zoom Controls on bottom-right */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(z + 0.25, 2))}
                  aria-label="Zoom in"
                  title="Zoom in"
                  style={{
                    width: 36,
                    height: 36,
                    background: '#fff',
                    border: '1.5px solid #111',
                    borderRadius: 8,
                    boxShadow: '0 2px 0 #111',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(z - 0.25, 0.75))}
                  aria-label="Zoom out"
                  title="Zoom out"
                  style={{
                    width: 36,
                    height: 36,
                    background: '#fff',
                    border: '1.5px solid #111',
                    borderRadius: 8,
                    boxShadow: '0 2px 0 #111',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: What Can We Help You With? */}
      <section style={{ padding: '36px 0 60px' }} aria-labelledby="help-title">
        <div className={publicStyles.eyebrow}>
          <span className={publicStyles.eyebrowDot} />
          HAVE A QUESTION?
        </div>
        <h2 id="help-title" className={publicStyles.sectionTitle}>
          What Can We Help You With?
        </h2>
        <p className={publicStyles.sectionSubtitle}>
          Choose a category below or reach out directly. We&apos;ll get back to you as soon as
          possible.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            marginTop: 32,
          }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.title}
                href={cat.href}
                className={publicStyles.tactileCard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  textDecoration: 'none',
                  padding: '22px 20px',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      border: '2px solid #111',
                      boxShadow: '0 2px 0 #111',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color="#111" />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: '0 0 4px 0',
                        color: '#111',
                      }}
                    >
                      {cat.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: '#666',
                        margin: 0,
                        lineHeight: 1.35,
                      }}
                    >
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#fff',
                    border: '1.5px solid #111',
                    boxShadow: '0 2px 0 #111',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ArrowRight size={15} color="#111" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Bottom Banner: Event Reminder & Still have questions? */}
      <section style={{ padding: '20px 0 48px' }}>
        <div className={publicStyles.bottomBanner}>
          <div className={publicStyles.bottomBannerContent}>
            <div
              className={publicStyles.eyebrow}
              style={{
                marginBottom: 16,
                background: 'rgba(255, 255, 255, 0.75)',
              }}
            >
              <CalendarDays size={13} color="#111" />
              EVENT REMINDER
            </div>

            <h3
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(26px, 3.2vw, 36px)',
                fontWeight: 700,
                letterSpacing: '-1px',
                margin: '0 0 16px 0',
                color: '#111',
              }}
            >
              NIRAL Hackathon 2026
            </h3>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                fontSize: 14,
                fontWeight: 600,
                color: '#444',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={16} />
                <span>December 3–4, 2026</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} />
                <span>Sri Shakthi Institute of Engineering and Technology</span>
              </div>
            </div>
          </div>

          <div className={publicStyles.bottomBannerAction}>
            <div style={{ maxWidth: 320 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0', color: '#111' }}>
                Still have questions?
              </h4>
              <p style={{ fontSize: 13.5, color: '#555', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                We&apos;re just a message away. Reach out and our team will be happy to assist you.
              </p>
              <PopButton href="mailto:iotclub.siet@gmail.com?subject=[NIRAL 2026] Inquiry">
                Contact Us Now <ArrowRight size={15} />
              </PopButton>
            </div>

            {/* Tactile Speech Bubble Illustration */}
            <div
              style={{
                width: 90,
                height: 75,
                background: '#fff',
                border: '2.5px solid #111',
                borderRadius: '18px 18px 6px 18px',
                boxShadow: '0 4px 0 #111',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: 'var(--niral-coral, #fd9b9b)',
                    border: '1.5px solid #111',
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: 'var(--niral-coral, #fd9b9b)',
                    border: '1.5px solid #111',
                  }}
                />
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: 'var(--niral-coral, #fd9b9b)',
                    border: '1.5px solid #111',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
