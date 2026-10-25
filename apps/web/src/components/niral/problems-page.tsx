'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Search,
  Target,
  FileText,
  Layers,
} from 'lucide-react';
import { PublicPageShell } from './public-page-shell';
import { PopButton } from './pop-button';
import { ProblemsChallengeArt } from './art-components';
import publicStyles from './public-pages.module.css';

export function ProblemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulties');

  const categoryTabs = ['All', 'IoT', 'AI/ML', 'Sustainability', 'Healthcare', 'Smart Cities', 'Education'];

  // Empty state: no mock problems published as facts
  const publishedProblems: {
    id: string;
    title: string;
    description: string;
    track: string;
    categories: string[];
    difficulty: string;
    objectives: string;
    deliverables: string;
  }[] = [];

  const filteredProblems = publishedProblems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === 'All' || p.categories.includes(selectedTrack);
    const matchesDifficulty =
      selectedDifficulty === 'All Difficulties' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesTrack && matchesDifficulty;
  });

  return (
    <PublicPageShell activeRoute="/problems">
      {/* Hero */}
      <section className={publicStyles.heroSection} aria-labelledby="problems-title">
        <div className={publicStyles.heroContent}>
          <div className={publicStyles.eyebrow}>
            <span className={publicStyles.eyebrowDot} />
            NIRAL 2026 · PROBLEM STATEMENTS
          </div>
          <h1 id="problems-title" className={publicStyles.heroHeading}>
            Problem
            <br />
            <mark>Statements</mark>
          </h1>
          <p className={publicStyles.heroSubtitle}>
            Real-world challenges. Meaningful solutions. Explore problem
            statements across diverse domains, build innovative solutions, and
            create impact through IoT and emerging technologies.
          </p>
        </div>
        <ProblemsChallengeArt />
      </section>

      {/* Search & Filters */}
      <div className={publicStyles.filterBarContainer}>
        <div className={publicStyles.searchRow}>
          <div className={publicStyles.searchBox}>
            <Search size={18} color="#777" />
            <input
              type="text"
              placeholder="Search problem statements by keyword, domain, or technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search problem statements"
            />
          </div>
          <select
            className={publicStyles.selectDropdown}
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            aria-label="Filter by track"
          >
            <option>All</option>
            <option>IoT</option>
            <option>AI/ML</option>
            <option>Sustainability</option>
            <option>Healthcare</option>
            <option>Smart Cities</option>
            <option>Education</option>
          </select>
          <select
            className={publicStyles.selectDropdown}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            aria-label="Filter by difficulty"
          >
            <option>All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </div>

      {/* Category Tabs & Problem Grid */}
      <section style={{ margin: '30px 0 60px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <span className={publicStyles.sectionEyebrow}>EXPLORE CHALLENGES</span>
            <h2 className={publicStyles.sectionTitle}>
              Featured <mark>Problem Statements</mark>
            </h2>
          </div>
          <div className={publicStyles.chipGroup}>
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTrack(tab)}
                className={`${publicStyles.filterChip} ${
                  selectedTrack === tab ? publicStyles.filterChipActive : ''
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredProblems.length === 0 && (
          <div
            className={publicStyles.tactileCard}
            style={{
              padding: '52px 36px',
              textAlign: 'center',
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <FileText size={32} color="#111" />
            </div>
            <h3
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                margin: '0 0 10px 0',
              }}
            >
              Problem Statements Coming Soon
            </h3>
            <p
              style={{
                fontSize: 15,
                color: '#666',
                lineHeight: 1.55,
                maxWidth: 440,
                margin: '0 auto 24px',
              }}
            >
              Official problem statements will be published by the organizing
              team ahead of the hackathon. Stay tuned for real-world IoT,
              AI/ML, sustainability, and smart cities challenges.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              <PopButton href="/tracks">
                Explore Tracks <ArrowRight size={16} />
              </PopButton>
              <PopButton href="/updates" cream>
                View Updates
              </PopButton>
            </div>
          </div>
        )}
      </section>

      {/* From Problems to Possibilities */}
      <section style={{ margin: '60px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div
            className={publicStyles.tactileCardPeach}
            style={{ padding: 32 }}
          >
            <span className={publicStyles.sectionEyebrow} style={{ color: '#b54949' }}>
              TURN IDEAS INTO IMPACT
            </span>
            <h2 className={publicStyles.sectionTitle}>
              From Problems
              <br />
              to <mark>Possibilities</mark>
            </h2>
            <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.5, marginTop: 12 }}>
              Each problem statement is designed to inspire innovation, address
              real-world needs, and align with the goals of a smarter, more
              inclusive future.
            </p>
          </div>

          {[
            {
              title: 'Objectives',
              desc: 'Understand the real-world problem, identify user needs, and define a solution approach using IoT and emerging technologies.',
              icon: Target,
            },
            {
              title: 'Deliverables',
              desc: 'A working prototype, source code, documentation, and a final presentation demonstrating impact, scalability, and innovation.',
              icon: FileText,
            },
            {
              title: 'Related Tracks',
              desc: 'Each problem is mapped to relevant tracks like IoT, AI/ML, Sustainability, Healthcare, Smart Cities, and Education to guide your solution.',
              icon: Layers,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={publicStyles.tactileCard} style={{ padding: 24 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'var(--niral-soft-coral, #ffe2db)',
                    border: '1.5px solid #111',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Icon size={20} color="#111" />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13.5, color: '#555', margin: 0, lineHeight: 1.45 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={publicStyles.bottomBanner}>
        <div className={publicStyles.bottomBannerText}>
          <h2 className={publicStyles.bottomBannerHeading}>
            Ready to take on a challenge?
          </h2>
          <p className={publicStyles.bottomBannerSubtext}>
            Explore all problem statements and start building your solution today.
          </p>
        </div>
        <PopButton href="/tracks">
          Browse All Problems <ArrowRight size={18} />
        </PopButton>
      </section>
    </PublicPageShell>
  );
}
