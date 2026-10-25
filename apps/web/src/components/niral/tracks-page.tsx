'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import {
  ArrowRight,
  Play,
  Search,
  Wifi,
  Cpu,
  Settings,
  Radio,
  Building,
  Target,
  FileText,
  Users,
  Rocket,
  Leaf,
  Heart,
  BookOpen,
  Building2,
  X,
  Layers,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { TracksConstellationArt } from './art-components';
import publicStyles from './public-pages.module.css';

interface TrackItem {
  id: string;
  title: string;
  category: string;
  icon: ElementType;
  description: string;
  problemsCount: string;
  technologies: string[];
  hardware: string[];
  sampleProject: string;
}

export function TracksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');
  const [activeModalTrack, setActiveModalTrack] = useState<TrackItem | null>(null);

  const categories = [
    'All Tracks',
    'Hardware',
    'Software',
    'AI/ML',
    'IoT',
    'Sustainability',
  ];

  const tracks: TrackItem[] = [
    {
      id: 'iot',
      title: 'IoT',
      category: 'IoT',
      icon: Wifi,
      description: 'Build connected solutions for a smarter, safer and more efficient world.',
      problemsCount: 'Curated Challenges',
      technologies: ['MQTT', 'ESP-IDF', 'Node-RED', 'LoRaWAN', 'BLE'],
      hardware: ['ESP32', 'Raspberry Pi', 'LoRa Nodes', 'Environmental Sensors'],
      sampleProject: 'Autonomous IoT telemetry mesh with real-time cloud failover',
    },
    {
      id: 'ai-edge',
      title: 'AI + Edge',
      category: 'AI/ML',
      icon: Cpu,
      description: 'Bring intelligent systems to the edge with next-gen AI/ML solutions.',
      problemsCount: 'Curated Challenges',
      technologies: ['TensorFlow Lite', 'Edge Impulse', 'OpenCV', 'PyTorch Mobile'],
      hardware: ['Jetson Nano', 'ESP32-S3 AI', 'Raspberry Pi Camera', 'Kneron NPU'],
      sampleProject: 'On-device vision defect detection and predictive vibration analytics',
    },
    {
      id: 'smart-systems',
      title: 'Smart Systems',
      category: 'Hardware',
      icon: Settings,
      description: 'Design integrated systems that solve real-world industrial and civic challenges.',
      problemsCount: 'Curated Challenges',
      technologies: ['SCADA', 'Modbus', 'CAN bus', 'Industrial Gateway', 'Docker'],
      hardware: ['PLC Controllers', 'RS485 Adapters', 'Current Sensors', 'Smart Relays'],
      sampleProject: 'Factory floor digital twin with real-time anomaly isolation',
    },
    {
      id: 'robotics',
      title: 'Robotics',
      category: 'Hardware',
      icon: Layers,
      description: 'Create autonomous, assistive and intelligent machines for the future.',
      problemsCount: 'Curated Challenges',
      technologies: ['ROS2', 'Micro-ROS', 'Computer Vision', 'PID Control', 'LiDAR'],
      hardware: ['Stepper Drivers', 'STM32 Nucleo', 'Time-of-Flight Sensors', 'Robotic Arm'],
      sampleProject: 'Assistive navigation robot with obstacle avoidance and voice telemetry',
    },
    {
      id: 'embedded-systems',
      title: 'Embedded Systems',
      category: 'Hardware',
      icon: Radio,
      description: 'Build low-level, high-impact solutions with embedded hardware and firmware.',
      problemsCount: 'Curated Challenges',
      technologies: ['C/C++', 'FreeRTOS', 'Bare-metal ARM', 'I2C/SPI', 'UART'],
      hardware: ['STM32', 'RP2040', 'Nordic nRF52', 'Custom PCB Nodes'],
      sampleProject: 'Ultra low-power battery-operated soil logger running FreeRTOS',
    },
    {
      id: 'smart-campus',
      title: 'Smart Campus',
      category: 'Sustainability',
      icon: Building,
      description: 'Reimagine campus life with technology-driven, sustainable solutions.',
      problemsCount: 'Curated Challenges',
      technologies: ['GIS', 'MQTT', 'Energy Analytics', 'Smart Attendance', 'Next.js'],
      hardware: ['RFID/NFC Readers', 'Power Clamps', 'Occupancy Sensors', 'Indoor Gateways'],
      sampleProject: 'Campus load-shedding monitor and intelligent classroom ventilation',
    },
  ];

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All Tracks' ||
      track.category === selectedCategory ||
      (selectedCategory === 'Software' && track.technologies.includes('Next.js'));

    return matchesSearch && matchesCategory;
  });

  return (
    <PublicPageShell activeRoute="/tracks">
      {/* Hero Section */}
      <section className={publicStyles.heroSection} aria-labelledby="tracks-hero-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            NIRAL 2026 · INNOVATION TRACKS
          </div>
          <h1 id="tracks-hero-title" className={publicStyles.heroHeading}>
            Different minds.
            <br />
            <mark>Shared tracks.</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Explore focused innovation tracks at NIRAL Hackathon 2026. Choose a
            domain, solve real-world problem statements, and build impactful
            solutions with your team.
          </p>
          <div className={publicStyles.heroActions}>
            <PopButton href="/problems">
              Explore Problem Statements <ArrowRight size={18} />
            </PopButton>
            <PopButton href="#tracks-grid" cream>
              <Play size={16} /> How Tracks Work
            </PopButton>
          </div>
        </div>
        <TracksConstellationArt />
      </section>

      {/* Search & Category Filter Bar */}
      <div className={publicStyles.filterBarContainer} id="tracks-grid">
        <div className={publicStyles.searchRow}>
          <div className={publicStyles.searchBox}>
            <Search size={18} color="#777" />
            <input
              type="text"
              placeholder="Search tracks (e.g. IoT, AI, Robotics...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search innovation tracks"
            />
          </div>
          <div className={publicStyles.chipGroup}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${publicStyles.filterChip} ${
                  selectedCategory === cat ? publicStyles.filterChipActive : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explore the Tracks Grid */}
      <section style={{ margin: '30px 0 60px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <span className={publicStyles.sectionEyebrow}>INNOVATION TRACKS</span>
            <h2 className={publicStyles.sectionTitle}>
              Explore the <mark>Tracks</mark>
            </h2>
          </div>
          <p className={publicStyles.sectionSubtitle} style={{ maxWidth: 480 }}>
            Each track represents a unique domain of innovation. Pick your
            interest, dive into problem statements, and build solutions that create
            real-world impact.
          </p>
        </div>

        {/* Tracks Grid (6 Cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}
        >
          {filteredTracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className={publicStyles.tactileCard}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 220,
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
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        background: 'var(--niral-coral, #fd9b9b)',
                        border: '2px solid #111',
                        boxShadow: '0 3px 0 #111',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon size={24} color="#111" />
                    </div>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: '#faf7f2',
                        border: '1.2px solid #111',
                        padding: '3px 9px',
                        borderRadius: 6,
                      }}
                    >
                      {track.problemsCount}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: 22,
                      fontWeight: 700,
                      margin: '0 0 6px 0',
                    }}
                  >
                    {track.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                    {track.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #eee',
                    paddingTop: 12,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#777', fontWeight: 600 }}>
                    {track.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModalTrack(track)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      border: '1.5px solid #111',
                      boxShadow: '0 2px 0 #111',
                      cursor: 'pointer',
                    }}
                    aria-label={`View details for ${track.title}`}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How Tracks Connect to Problem Statements */}
      <section style={{ margin: '60px 0' }}>
        <div style={{ marginBottom: 32 }}>
          <span className={publicStyles.sectionEyebrow}>FROM TRACKS TO IMPACT</span>
          <h2 className={publicStyles.sectionTitle}>
            How Tracks Connect to <mark>Problem Statements</mark>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
          }}
        >
          {[
            {
              title: 'Choose a Track',
              desc: 'Pick a domain aligned with your interests and skills.',
              icon: Target,
            },
            {
              title: 'Explore Problems',
              desc: 'Find curated problem statements under each track.',
              icon: FileText,
            },
            {
              title: 'Form a Team',
              desc: 'Collaborate with like-minded innovators to ideate and build.',
              icon: Users,
            },
            {
              title: 'Build & Innovate',
              desc: 'Create impactful solutions and present your ideas.',
              icon: Rocket,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={publicStyles.tactileCardCream} style={{ padding: 20 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--niral-soft-coral, #ffe2db)',
                    border: '1.5px solid #111',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Icon size={18} color="#111" />
                </div>
                <h3
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 16.5,
                    fontWeight: 700,
                    margin: '0 0 6px 0',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.4 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Domains */}
      <section style={{ margin: '60px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className={publicStyles.sectionEyebrow}>FEATURED DOMAINS</span>
          <h2 className={publicStyles.sectionTitle}>
            Real-World Challenges. <mark>Bigger Possibilities.</mark>
          </h2>
          <p className={publicStyles.sectionSubtitleCenter}>
            Our tracks are aligned with global and local challenges, giving you a
            chance to work on meaningful, future-focused innovations.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 36,
          }}
        >
          {[
            { name: 'Sustainability', desc: 'Greener solutions for a better future', icon: Leaf },
            { name: 'Healthcare', desc: 'Technology for healthier communities', icon: Heart },
            { name: 'Education', desc: 'Innovative learning experiences', icon: BookOpen },
            { name: 'Smart Cities', desc: 'Smarter, livable urban spaces', icon: Building2 },
            { name: 'Social Impact', desc: 'Inclusive solutions for stronger societies', icon: Users },
          ].map((dom) => {
            const Icon = dom.icon;
            return (
              <div key={dom.name} className={publicStyles.tactileCard} style={{ padding: 18, textAlign: 'center' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--niral-soft-coral, #ffe2db)',
                    border: '1.5px solid #111',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Icon size={20} color="#111" />
                </div>
                <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>
                  {dom.name}
                </h4>
                <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                  {dom.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PopButton href="/problems">
            Explore All Problem Statements <ArrowRight size={18} />
          </PopButton>
        </div>
      </section>

      {/* Track Detail Modal */}
      {activeModalTrack && (
        <div
          className={publicStyles.modalOverlay}
          onClick={() => setActiveModalTrack(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={publicStyles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={publicStyles.modalCloseBtn}
              onClick={() => setActiveModalTrack(null)}
              aria-label="Close track details"
            >
              <X size={18} />
            </button>

            <span className={publicStyles.sectionEyebrow}>TRACK OVERVIEW</span>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>
              {activeModalTrack.title}
            </h2>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 20 }}>
              {activeModalTrack.description}
            </p>

            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                Suggested Hardware Platforms
              </h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {activeModalTrack.hardware.map((hw) => (
                  <span
                    key={hw}
                    style={{
                      background: 'var(--niral-soft-coral, #ffe2db)',
                      border: '1.2px solid #111',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {hw}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                Sample Architecture / Project
              </h4>
              <p style={{ fontSize: 13.5, color: '#333', background: '#faf7f2', padding: 12, borderRadius: 8, border: '1px solid #dededb' }}>
                {activeModalTrack.sampleProject}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <PopButton href="/problems" onClick={() => setActiveModalTrack(null)}>
                View Problem Statements <ArrowRight size={16} />
              </PopButton>
              <PopButton href="/register" cream onClick={() => setActiveModalTrack(null)}>
                Register for this Track
              </PopButton>
            </div>
          </div>
        </div>
      )}
    </PublicPageShell>
  );
}
