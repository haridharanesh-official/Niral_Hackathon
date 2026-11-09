'use client';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import styles from './auth.module.css';
export type AuthStory =
  'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'apply' | 'review' | 'status';
const stories: Record<
  AuthStory,
  { command: string; title: string; lines: string[]; badge: string; accent: string }
> = {
  login: {
    command: '$ niral auth --login',
    title: '01  SIGN IN',
    lines: [
      '✓ sign-in form ready',
      '> enter your registered email',
      '→ continue to your role dashboard',
    ],
    badge: 'ACCESS READY',
    accent: 'ONE SECURE LOGIN',
  },
  register: {
    command: '$ niral account --create',
    title: '02  CREATE ACCOUNT',
    lines: [
      '+ profile setup initialized',
      '> choose a strong password',
      '→ verify email to proceed',
    ],
    badge: 'NEW ACCOUNT',
    accent: 'LET’S GET STARTED',
  },
  verify: {
    command: '$ niral verify --email',
    title: '03  VERIFY EMAIL',
    lines: [
      '> open your one-time verification link',
      '> confirm ownership of your inbox',
      '→ return to sign in',
    ],
    badge: 'EMAIL OWNERSHIP',
    accent: 'YOUR NEXT STEP',
  },
  forgot: {
    command: '$ niral account --recover',
    title: '04  RECOVERY',
    lines: [
      '> request a recovery email',
      '> follow the one-time link',
      '→ choose a new password',
    ],
    badge: 'ACCOUNT RECOVERY',
    accent: 'A FRESH START',
  },
  reset: {
    command: '$ niral password --reset',
    title: '05  NEW PASSWORD',
    lines: [
      '> choose a strong password',
      '> confirm your new password',
      '→ existing sessions are revoked on success',
    ],
    badge: 'PASSWORD RESET',
    accent: 'BACK TO BUILDING',
  },
  apply: {
    command: '$ niral event --apply',
    title: '06  APPLICATION',
    lines: [
      '> identity / academics / interests',
      '> review your application',
      '→ submit for organizer review',
    ],
    badge: 'YOUR APPLICATION',
    accent: 'BUILD WHAT MATTERS',
  },
  review: {
    command: '$ niral application --review',
    title: '07  REVIEW',
    lines: [
      '> check your details',
      '> confirm the declaration',
      '→ submission is separate from approval',
    ],
    badge: 'CHECK YOUR DETAILS',
    accent: 'READY WHEN YOU ARE',
  },
  status: {
    command: '$ niral application --status',
    title: '08  APPLICATION STATUS',
    lines: [
      '> read your saved application',
      '> review the organizer decision',
      '→ stay informed through official updates',
    ],
    badge: 'APPLICATION STATUS',
    accent: 'THE JOURNEY CONTINUES',
  },
};
export function AuthTerminal({
  story,
  status = 'Ready when you are',
}: {
  story: AuthStory;
  status?: string;
}) {
  const data = stories[story];
  const reduced = useReducedMotion();
  const [tab, setTab] = useState('Guide');
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState('');
  const [line, setLine] = useState(0);
  const x = useSpring(0, { stiffness: 160, damping: 24 }),
    y = useSpring(0, { stiffness: 160, damping: 24 });
  useEffect(() => {
    if (reduced || paused) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n++;
      setTyped(data.command.slice(0, n));
      if (n >= data.command.length) window.clearInterval(timer);
    }, 35);
    return () => window.clearInterval(timer);
  }, [data.command, reduced, paused]);
  return (
    <aside
      className={styles.scene}
      aria-label="NIRAL interactive guide"
      onPointerMove={(e) => {
        if (reduced || paused || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(-(e.clientY - r.top - r.height / 2) / 80);
        y.set((e.clientX - r.left - r.width / 2) / 80);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <span className={styles.badge}>{data.badge}</span>
      <motion.div className={styles.terminal} style={{ rotateX: x, rotateY: y }}>
        <div className={styles.toolbar}>
          <span aria-hidden="true">● ● ●</span>
          <span>NIRAL / TERMINAL</span>
        </div>
        <div className={styles.terminalBody}>
          <p className={styles.session}>SESSION / {data.title}</p>
          <div className={styles.output}>
            <div>
              <span className={styles.command} aria-label={data.command}>
                {reduced || paused ? data.command : typed || data.command}
                <span className={styles.cursor} aria-hidden="true" />
              </span>
            </div>
            {tab === 'Guide' ? (
              data.lines.map((text, i) => (
                <button
                  type="button"
                  className={`${styles.line} ${line === i ? styles.activeLine : ''}`}
                  key={text}
                  onClick={() => setLine(i)}
                  aria-pressed={line === i}
                >
                  {text}
                </button>
              ))
            ) : (
              <>
                <p>Current form state</p>
                <p role="status">{status}</p>
                <p className={styles.activeLine}>
                  → only server responses confirm completion
                </p>
              </>
            )}
          </div>
          <div className={styles.terminalTabs}>
            <button
              type="button"
              aria-pressed={tab === 'Guide'}
              onClick={() => setTab('Guide')}
            >
              Guide
            </button>
            <button
              type="button"
              aria-pressed={tab === 'Status'}
              onClick={() => setTab('Status')}
            >
              Form status
            </button>
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => {
                setPaused(!paused);
                x.set(0);
                y.set(0);
              }}
            >
              {paused ? 'Resume motion' : 'Pause motion'}
            </button>
          </div>
          <p className={styles.terminalFoot}>{'// NIRAL HACKATHON 2026'}</p>
        </div>
      </motion.div>
      <span className={styles.accent}>{data.accent}</span>
      <p className={styles.hint} style={{ marginTop: 16 }}>
        An interactive guide, not a command shell.
      </p>
    </aside>
  );
}
