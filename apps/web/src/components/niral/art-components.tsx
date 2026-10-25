'use client';

import { useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import {
  Code2,
  Lightbulb,
  Zap,
  Cpu,
  Users,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Megaphone,
  MapPin,
  Radio,
  Wifi,
  Sparkles,
  Layers,
  Heart,
  Building,
} from 'lucide-react';
import publicStyles from './public-pages.module.css';

// Hook for interactive 3D card tilt
function useCardTilt(intensity = 35) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 160, damping: 20 });
  const y = useSpring(0, { stiffness: 160, damping: 20 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;
    x.set(-(e.clientY - midY) / intensity);
    y.set((e.clientX - midX) / intensity);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { x, y, handlePointerMove, handlePointerLeave, reduced };
}

// 1. ABOUT HERO ART: Layered browser window with </> tile, lightbulb, lightning, and floating badges
export function AboutHeroArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(30);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Background slanted card */}
        <div
          style={{
            position: 'absolute',
            inset: '10% 8% 10% 12%',
            background: 'var(--niral-soft-coral, #ffe2db)',
            border: '2.5px solid #111',
            borderRadius: '20px',
            transform: 'translateZ(-15px) rotate(4deg)',
          }}
        />

        {/* Main code window */}
        <div
          style={{
            position: 'absolute',
            inset: '4% 6% 12% 6%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '22px',
            boxShadow: '0 8px 0 #111',
            transform: 'translateZ(20px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Window header */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '2px solid #111',
              background: '#faf7f2',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fd9b9b', border: '1px solid #111' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffe2db', border: '1px solid #111' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#111' }} />
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 12, color: '#666', letterSpacing: 1.5 }}>
              NIRAL_STUDIO.PROTOTYPE
            </span>
          </div>

          {/* Window body with centered 3D code badge */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              background: 'radial-gradient(#dededb 0.75px, transparent 0.75px) 4px 4px/18px 18px, #fff',
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: -4 }}
              style={{
                width: '60%',
                aspectRatio: '1.4 / 1',
                background: 'var(--niral-coral, #fd9b9b)',
                border: '2.5px solid #111',
                borderRadius: '16px',
                boxShadow: '0 6px 0 #111',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <Code2 size={68} strokeWidth={2.2} color="#111" />
            </motion.div>
          </div>
        </div>

        {/* Floating Badges */}
        <button
          type="button"
          onClick={() => setActiveBadge(activeBadge === 'ideate' ? null : 'ideate')}
          className={publicStyles.floatingBadge}
          style={{ top: '2%', left: '0%' }}
        >
          <Lightbulb size={18} color="#b85b5b" />
          <span>Ideate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBadge(activeBadge === 'build' ? null : 'build')}
          className={publicStyles.floatingBadge}
          style={{ top: '2%', right: '2%' }}
        >
          <Zap size={18} color="#111" />
          <span>Build</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBadge(activeBadge === 'connect' ? null : 'connect')}
          className={publicStyles.floatingBadge}
          style={{ bottom: '15%', left: '-4%' }}
        >
          <Users size={18} color="#111" />
          <span>Connect</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBadge(activeBadge === 'innovate' ? null : 'innovate')}
          className={publicStyles.floatingBadge}
          style={{ bottom: '10%', right: '-2%' }}
        >
          <Cpu size={18} color="#111" />
          <span>Innovate</span>
        </button>
      </motion.div>
    </div>
  );
}

// 2. ABOUT EXPERIENCE ART: Laptop with 3D cube and IoT signal nodes
export function AboutExperienceArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(32);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Isometric laptop base */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '12%',
            right: '12%',
            height: '42%',
            background: '#faf7f2',
            border: '2.5px solid #111',
            borderRadius: '16px',
            boxShadow: '0 8px 0 #111',
            transform: 'rotateX(48deg) rotateZ(-18deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Trackpad */}
          <div
            style={{
              width: '32%',
              height: '38%',
              border: '1.5px solid #111',
              borderRadius: '8px',
              background: '#fff',
            }}
          />
        </div>

        {/* Laptop Screen standing up */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '20%',
            right: '20%',
            height: '58%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '16px',
            boxShadow: '0 6px 0 #111',
            transform: 'translateZ(30px) rotateZ(-2deg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: 28,
              borderBottom: '2px solid #111',
              background: 'var(--niral-soft-coral, #ffe2db)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: 6,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fd9b9b', border: '1px solid #111' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', border: '1px solid #111' }} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              background: 'radial-gradient(#dededb 0.75px, transparent 0.75px) 3px 3px/14px 14px, #fff',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
              style={{
                width: 64,
                height: 64,
                background: 'var(--niral-coral, #fd9b9b)',
                border: '2px solid #111',
                borderRadius: '12px',
                boxShadow: '0 4px 0 #111',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Cpu size={36} color="#111" />
            </motion.div>
          </div>
        </div>

        {/* Wi-Fi & Signal satellite nodes */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '10%',
            padding: '10px 14px',
            background: '#fff',
            border: '2px solid #111',
            borderRadius: '12px',
            boxShadow: '0 3px 0 #111',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Wifi size={18} color="#b85b5b" />
          <span style={{ fontSize: 12, fontWeight: 700 }}>IoT Mesh</span>
        </div>
      </motion.div>
    </div>
  );
}

// 3. PARTICIPATE HERO ART: Monitor with interactive code snippet and step indicators
export function ParticipateHeroArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(28);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '6% 8%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '20px',
            boxShadow: '0 8px 0 #111',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '2px solid #111',
              background: '#faf7f2',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fd9b9b', border: '1px solid #111' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffe2db', border: '1px solid #111' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#111' }} />
            <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 10, color: '#666' }}>
              NIRAL_REGISTER.SH
            </span>
          </div>

          <div
            style={{
              flex: 1,
              padding: '24px',
              background: 'radial-gradient(#dededb 0.75px, transparent 0.75px) 4px 4px/16px 16px, #fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '74%',
                height: '56%',
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                borderRadius: '16px',
                boxShadow: '0 5px 0 #111',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Code2 size={56} color="#111" />
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', border: '1.5px solid #111', padding: '4px 8px', borderRadius: 6 }}>
                1. Account
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#fff', border: '1.5px solid #111', padding: '4px 8px', borderRadius: 6 }}>
                2. Apply
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--niral-coral, #fd9b9b)', border: '1.5px solid #111', padding: '4px 8px', borderRadius: 6 }}>
                3. Build
              </span>
            </div>
          </div>
        </div>

        {/* Floating Badges */}
        <div className={publicStyles.floatingBadge} style={{ top: '0%', left: '0%' }}>
          <Lightbulb size={16} color="#b85b5b" />
          <span>Ideas</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ top: '4%', right: '-2%' }}>
          <Zap size={16} color="#111" />
          <span>Build</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '8%', left: '-4%' }}>
          <Users size={16} color="#111" />
          <span>Collaborate</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '4%', right: '2%' }}>
          <Sparkles size={16} color="#b85b5b" />
          <span>Innovate</span>
        </div>
      </motion.div>
    </div>
  );
}

// 4. TRACKS CONSTELLATION ART: Center "N" 3D square tile with orbital domain satellites
export function TracksConstellationArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(35);

  const satellites = [
    { title: 'IoT', icon: Wifi, top: '2%', left: '32%' },
    { title: 'AI + Edge', icon: Cpu, top: '10%', right: '8%' },
    { title: 'Robotics', icon: Zap, bottom: '26%', right: '0%' },
    { title: 'Embedded', icon: Radio, bottom: '6%', right: '16%' },
    { title: 'Smart Campus', icon: Building, bottom: '10%', left: '10%' },
    { title: 'Smart Systems', icon: Layers, top: '22%', left: '2%' },
  ];

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Orbital SVG path */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox="0 0 460 400"
          fill="none"
        >
          <ellipse
            cx="230"
            cy="200"
            rx="180"
            ry="140"
            stroke="#111"
            strokeWidth="1.8"
            strokeDasharray="6 6"
            opacity="0.35"
          />
        </svg>

        {/* Center 3D tile with "N" */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) translateZ(40px)',
            width: 120,
            height: 120,
            background: 'var(--niral-coral, #fd9b9b)',
            border: '2.5px solid #111',
            borderRadius: '24px',
            boxShadow: '0 8px 0 #111',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '52px',
              fontWeight: 800,
              color: '#111',
            }}
          >
            N
          </span>
        </div>

        {/* Orbiting Satellite Nodes */}
        {satellites.map((sat) => {
          const Icon = sat.icon;
          return (
            <motion.div
              key={sat.title}
              whileHover={{ scale: 1.1, translateY: -3 }}
              style={{
                position: 'absolute',
                top: sat.top,
                bottom: sat.bottom,
                left: sat.left,
                right: sat.right,
                background: '#fff',
                border: '2px solid #111',
                borderRadius: '12px',
                padding: '8px 12px',
                boxShadow: '0 3px 0 #111',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                zIndex: 6,
              }}
            >
              <Icon size={16} color="#b85b5b" />
              <span>{sat.title}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// 5. PROBLEMS CHALLENGE ART: Stacked 3D challenge cards with lightbulb and domain stickers
export function ProblemsChallengeArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(32);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Back card 1 */}
        <div
          style={{
            position: 'absolute',
            inset: '16% 10% 12% 16%',
            background: '#faf7f2',
            border: '2px solid #111',
            borderRadius: '20px',
            transform: 'rotate(-6deg) translateZ(-20px)',
          }}
        />

        {/* Back card 2 */}
        <div
          style={{
            position: 'absolute',
            inset: '10% 12% 16% 12%',
            background: 'var(--niral-soft-coral, #ffe2db)',
            border: '2px solid #111',
            borderRadius: '20px',
            transform: 'rotate(4deg) translateZ(-10px)',
          }}
        />

        {/* Front challenge card */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 14%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '22px',
            boxShadow: '0 8px 0 #111',
            transform: 'translateZ(25px)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#999' }}>
              CHALLENGE
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--niral-coral, #fd9b9b)',
                border: '1.5px solid #111',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Lightbulb size={20} color="#111" />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: -1,
                lineHeight: 1.15,
                margin: '0 0 6px 0',
              }}
            >
              Solve <br />
              <mark
                style={{
                  background: 'var(--niral-soft-coral, #ffe2db)',
                  borderRadius: 6,
                  padding: '0 4px',
                }}
              >
                Real-World
              </mark> <br />
              Problems
            </h3>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
              Curated hardware & software challenges
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fd9b9b' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#111' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0dedb' }} />
          </div>
        </div>

        {/* Domain sticker pills */}
        <div className={publicStyles.floatingBadge} style={{ top: '2%', right: '0%' }}>
          <Cpu size={16} />
          <span>AI/ML</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '10%', left: '0%' }}>
          <Heart size={16} color="#e5484d" />
          <span>Healthcare</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '4%', right: '2%' }}>
          <Building size={16} />
          <span>Smart Cities</span>
        </div>
      </motion.div>
    </div>
  );
}

// 6. SCHEDULE CALENDAR ART: 3D spiral notebook calendar with "NIRAL 2026"
export function ScheduleCalendarArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(30);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Spiral binder top loops */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '20%',
            right: '20%',
            display: 'flex',
            justifyContent: 'space-around',
            zIndex: 10,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 22,
                background: '#111',
                borderRadius: '5px',
                border: '1.5px solid #fff',
              }}
            />
          ))}
        </div>

        {/* Main calendar pad */}
        <div
          style={{
            position: 'absolute',
            inset: '10% 12% 8% 12%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '20px',
            boxShadow: '0 8px 0 #111',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #111',
              paddingBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.5 }}>NIRAL 2026</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: 'var(--niral-soft-coral, #ffe2db)',
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #111',
              }}
            >
              DECEMBER
            </span>
          </div>

          {/* Calendar days grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              margin: '12px 0',
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((day) => {
              const isHackathonDay = day === 3 || day === 4;
              return (
                <div
                  key={day}
                  style={{
                    aspectRatio: '1',
                    border: '1.5px solid #111',
                    borderRadius: 8,
                    background: isHackathonDay ? 'var(--niral-coral, #fd9b9b)' : '#faf7f2',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: isHackathonDay ? '0 2px 0 #111' : 'none',
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Status footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
            <span>Thu: Day 1</span>
            <span>Fri: Day 2</span>
          </div>
        </div>

        {/* Floating schedule badges */}
        <div className={publicStyles.floatingBadge} style={{ top: '0%', left: '4%' }}>
          <Calendar size={16} color="#b85b5b" />
          <span>2 Days</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ top: '4%', right: '2%' }}>
          <Users size={16} />
          <span>Work</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '4%', right: '4%' }}>
          <Zap size={16} color="#111" />
          <span>Build</span>
        </div>
      </motion.div>
    </div>
  );
}

// 7. RULES GUIDELINES ART: 3D clipboard with checklist & shield
export function RulesGuidelinesArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(30);

  const checks = ['Be Fair', 'Build Responsibly', 'Create Impact', 'Have Fun!'];

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Clipboard wood back */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 14% 6% 14%',
            background: '#faf7f2',
            border: '2.5px solid #111',
            borderRadius: '20px',
            boxShadow: '0 8px 0 #111',
          }}
        />

        {/* Top binder clip */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            left: '36%',
            right: '36%',
            height: 24,
            background: 'var(--niral-coral, #fd9b9b)',
            border: '2px solid #111',
            borderRadius: '6px',
            boxShadow: '0 3px 0 #111',
            zIndex: 10,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span style={{ width: 24, height: 4, background: '#111', borderRadius: 2 }} />
        </div>

        {/* Paper Sheet */}
        <div
          style={{
            position: 'absolute',
            inset: '14% 18% 10% 18%',
            background: '#fff',
            border: '2px solid #111',
            borderRadius: '14px',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, borderBottom: '1.5px solid #111', paddingBottom: 6 }}>
            Hackathon Guidelines
          </span>

          {checks.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: 'var(--niral-coral, #fd9b9b)',
                  border: '1.5px solid #111',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CheckCircle2 size={12} color="#111" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Shield Badge */}
        <div
          className={publicStyles.floatingBadge}
          style={{ bottom: '12%', right: '2%', background: 'var(--niral-soft-coral, #ffe2db)' }}
        >
          <ShieldCheck size={18} color="#111" />
          <span>Safe & Inclusive</span>
        </div>
      </motion.div>
    </div>
  );
}

// 8. UPDATES NOTICE BOARD ART: 3D Cork board with megaphone and pinned notes
export function UpdatesNoticeBoardArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(32);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Wooden frame board */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 10%',
            background: '#faf7f2',
            border: '3px solid #111',
            borderRadius: '22px',
            boxShadow: '0 8px 0 #111',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 12,
          }}
        >
          {/* Note 1 */}
          <div
            style={{
              background: '#fff',
              border: '2px solid #111',
              borderRadius: '12px',
              padding: '14px',
              boxShadow: '0 3px 0 #111',
              transform: 'rotate(-2deg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fd9b9b' }} />
              <Megaphone size={14} color="#b85b5b" />
            </div>
            <div>
              <strong style={{ fontSize: 14, display: 'block', lineHeight: 1.2 }}>
                Ideas today. <br />
                <mark style={{ background: '#ffe2db', padding: '0 2px' }}>Impact</mark> tomorrow.
              </strong>
            </div>
          </div>

          {/* Right column with notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                flex: 1,
                background: 'var(--niral-soft-coral, #ffe2db)',
                border: '2px solid #111',
                borderRadius: '10px',
                padding: '10px',
                transform: 'rotate(3deg)',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              📅 Important Dates Inside!
            </div>
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: '2px solid #111',
                borderRadius: '10px',
                padding: '10px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              🚀 Be a part of something bigger. →
            </div>
          </div>
        </div>

        {/* Megaphone 3D sticker on top right */}
        <div
          style={{
            position: 'absolute',
            top: '0%',
            right: '2%',
            width: 52,
            height: 52,
            background: 'var(--niral-coral, #fd9b9b)',
            border: '2px solid #111',
            borderRadius: '50%',
            boxShadow: '0 4px 0 #111',
            display: 'grid',
            placeItems: 'center',
            transform: 'translateZ(30px) rotate(15deg)',
          }}
        >
          <Megaphone size={26} color="#111" />
        </div>
      </motion.div>
    </div>
  );
}

// 9. FAQ QUESTIONS ART: Giant coral question mark card with speech bubbles
export function FaqQuestionsArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(32);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Back card */}
        <div
          style={{
            position: 'absolute',
            inset: '12% 16% 8% 12%',
            background: '#faf7f2',
            border: '2.5px solid #111',
            borderRadius: '20px',
            transform: 'rotate(-4deg) translateZ(-10px)',
          }}
        />

        {/* Center card with big ? */}
        <div
          style={{
            position: 'absolute',
            inset: '10% 18%',
            background: '#fff',
            border: '2.5px solid #111',
            borderRadius: '22px',
            boxShadow: '0 8px 0 #111',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              width: '75%',
              aspectRatio: '1',
              background: 'var(--niral-soft-coral, #ffe2db)',
              border: '2px solid #111',
              borderRadius: '18px',
              boxShadow: '0 4px 0 #111',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '84px',
                fontWeight: 800,
                color: '#111',
              }}
            >
              ?
            </span>
          </div>
        </div>

        {/* Floating speech bubbles */}
        <div className={publicStyles.floatingBadge} style={{ top: '2%', left: '4%' }}>
          <Lightbulb size={16} color="#b85b5b" />
          <span>Got a question?</span>
        </div>

        <div className={publicStyles.floatingBadge} style={{ top: '6%', right: '2%' }}>
          <span>Here to help!</span>
        </div>

        {/* Checklist card on bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '2%',
            right: '-2%',
            background: '#fff',
            border: '2px solid #111',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 3px 0 #111',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div>✓ Discover</div>
          <div>✓ Learn</div>
          <div>✓ Participate</div>
        </div>
      </motion.div>
    </div>
  );
}

// 10. CONTACT MAP ART: 3D folded map with red location pin 📍
export function ContactMapArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(32);

  return (
    <div
      className={publicStyles.artCanvas}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className={publicStyles.interactiveStack}
        style={{ rotateX: x, rotateY: y }}
      >
        {/* Folded Map Panel */}
        <div
          style={{
            position: 'absolute',
            inset: '12% 10%',
            background: '#faf7f2',
            border: '2.5px solid #111',
            borderRadius: '20px',
            boxShadow: '0 8px 0 #111',
            transform: 'rotateX(20deg) rotateZ(-3deg)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            overflow: 'hidden',
          }}
        >
          {/* Fold 1 */}
          <div
            style={{
              background: '#fff',
              borderRight: '1.5px dashed #ccc',
              position: 'relative',
              padding: 12,
            }}
          >
            <div style={{ width: '80%', height: 35, background: 'var(--niral-soft-coral, #ffe2db)', borderRadius: 6 }} />
          </div>

          {/* Fold 2 (Center) */}
          <div
            style={{
              background: '#faf7f2',
              borderRight: '1.5px dashed #ccc',
              position: 'relative',
              padding: 12,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {/* Center Location Pin */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                background: 'var(--niral-coral, #fd9b9b)',
                border: '2.5px solid #111',
                boxShadow: '0 4px 0 #111',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  background: '#fff',
                  borderRadius: '50%',
                  border: '2px solid #111',
                }}
              />
            </motion.div>
          </div>

          {/* Fold 3 */}
          <div style={{ background: '#fff', padding: 12 }}>
            <div style={{ width: '80%', height: 35, background: 'var(--niral-soft-coral, #ffe2db)', borderRadius: 6 }} />
          </div>
        </div>

        {/* Floating Contact Badges */}
        <div className={publicStyles.floatingBadge} style={{ top: '4%', left: '6%' }}>
          <span>✉ Get in Touch</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ top: '20%', right: '2%' }}>
          <span>📞 Let&apos;s Talk</span>
        </div>
        <div className={publicStyles.floatingBadge} style={{ bottom: '8%', left: '8%' }}>
          <MapPin size={16} color="#b85b5b" />
          <span>Visit Us</span>
        </div>
      </motion.div>
    </div>
  );
}
