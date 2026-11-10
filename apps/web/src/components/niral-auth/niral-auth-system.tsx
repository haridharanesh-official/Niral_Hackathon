'use client';

import React, {
  useId,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type InputHTMLAttributes,
} from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/niral/public-page-shell';
import { PopButton } from '@/components/niral/pop-button';
import { validatePasswordPolicy } from '@hackos/shared';
import styles from './niral-auth.module.css';

/* -------------------------------------------------------------------------- */
/* 1. NiralAuthHeader                                                         */
/* -------------------------------------------------------------------------- */
export function NiralAuthHeader({
  actionType = 'login',
}: {
  actionType?: 'login' | 'register' | 'none';
}) {
  return (
    <header className={styles.header}>
      <Logo />
      <nav aria-label="Authentication navigation" className={styles.headerNav}>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/rules">Event Rules</Link>
        <Link href="/schedule">Schedule</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <div className={styles.headerActions}>
        {actionType === 'login' ? (
          <PopButton href="/register" className={styles.headerActionBtn}>
            Create Account
          </PopButton>
        ) : actionType === 'register' ? (
          <PopButton href="/login" cream className={styles.headerActionBtn}>
            Sign In
          </PopButton>
        ) : null}
      </div>
    </header>
  );
}

function subscribeMotion(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
const getMotionPreference = () =>
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
const getServerSnapshot = () => false;

/* -------------------------------------------------------------------------- */
/* 2. NiralAuthIllustration                                                   */
/* -------------------------------------------------------------------------- */
export function NiralAuthIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionPreference,
    getServerSnapshot,
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 5; // max 5deg
    const rotateX = -(y / (rect.height / 2)) * 5; // max 5deg
    setTilt({ x: rotateX, y: rotateY });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={containerRef}
      className={styles.illustrationStage}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <div className={styles.stageGridOverlay} />

      {/* Circuit traces vector background */}
      <svg
        className={styles.circuitOverlay}
        viewBox="0 0 460 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 20 60 H 120 L 150 90 H 280 L 310 60 H 420"
          stroke="#FD9B9B"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M 40 220 H 160 L 200 180 H 320 L 350 210 H 430"
          stroke="#111111"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <circle cx="120" cy="60" r="4" fill="#FD9B9B" stroke="#111" />
        <circle cx="280" cy="90" r="4" fill="#FFE2DB" stroke="#111" />
        <circle cx="200" cy="180" r="4" fill="#111111" />
        <circle cx="320" cy="180" r="4" fill="#FD9B9B" stroke="#111" />
      </svg>

      {/* Floating badge top-right */}
      <span className={`${styles.floatingPill} ${styles.pillIoT}`}>
        ✦ Smart IoT Hub
      </span>

      {/* Outlined Browser Window Tile */}
      <div
        className={styles.illustrationCardInner}
        style={{
          transform: reducedMotion
            ? 'none'
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className={styles.browserWindow}>
          <div className={styles.browserHeader}>
            <div className={styles.browserDots}>
              <span className={`${styles.browserDot} ${styles.browserDotRed}`} />
              <span className={`${styles.browserDot} ${styles.browserDotPeach}`} />
              <span className={`${styles.browserDot} ${styles.browserDotDark}`} />
            </div>
            <div className={styles.browserUrlBar}>
              <Lock size={10} />
              <span>niralhackathon.dpdns.org/join</span>
            </div>
          </div>
          <pre className={styles.browserContent}>
            <code>
              <span className={styles.codeComment}>
                {'// NIRAL Hackathon 2026 Core'}
              </span>
              {'\n'}
              <span className={styles.codeKeyword}>const</span> event ={' '}
              <span className={styles.codeKeyword}>await</span>{' '}
              <span className={styles.codeFunction}>connectHub</span>({'{'}
              {'\n'}  <span className={styles.codeProp}>track</span>:{' '}
              <span className={styles.codeString}>&quot;AI + IoT Innovation&quot;</span>,
              {'\n'}  <span className={styles.codeProp}>dates</span>:{' '}
              <span className={styles.codeString}>&quot;Dec 3–4, 2026&quot;</span>,
              {'\n'}  <span className={styles.codeProp}>venue</span>:{' '}
              <span className={styles.codeString}>&quot;Sri Shakthi, Coimbatore&quot;</span>,
              {'\n'}  <span className={styles.codeProp}>status</span>:{' '}
              <span className={styles.codeString}>&quot;READY_TO_BUILD&quot;</span>
              {'\n'}
              {'}'});
            </code>
          </pre>
        </div>

        {/* Coral code tile */}
        <div className={styles.coralCodeTile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} />
            <strong>Hardware + AI Hub</strong>
          </div>
          <span>36h Non-stop Innovation Prototype</span>
        </div>
      </div>

      {/* Floating badge bottom-left */}
      <span className={`${styles.floatingPill} ${styles.pillAI}`}>
        ◈ Edge AI Engine
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. NiralAuthCard                                                           */
/* -------------------------------------------------------------------------- */
export function NiralAuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${styles.authCard} ${className}`}>
      <div className={styles.cardHeader}>
        {eyebrow && <span className={styles.cardEyebrow}>{eyebrow}</span>}
        <h1 className={styles.cardTitle}>{title}</h1>
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      {children}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. NiralTextField                                                          */
/* -------------------------------------------------------------------------- */
export function NiralTextField({
  label,
  error,
  required = false,
  optional = false,
  type = 'text',
  id: customId,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
}) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        <span>
          {label} {required && <span className={styles.requiredAsterisk}>*</span>}
        </span>
        {optional && <span className={styles.optionalTag}>(optional)</span>}
      </label>
      <input
        {...props}
        id={id}
        type={type}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${styles.input} ${error ? styles.inputInvalid : ''}`}
      />
      {error && (
        <span id={`${id}-error`} className={styles.fieldError} role="alert">
          <AlertCircle size={14} /> {error}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. NiralPasswordField                                                      */
/* -------------------------------------------------------------------------- */
export function NiralPasswordField({
  label,
  error,
  required = false,
  id: customId,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  const generatedId = useId();
  const id = customId || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        <span>
          {label} {required && <span className={styles.requiredAsterisk}>*</span>}
        </span>
      </label>
      <div className={styles.passwordWrapper}>
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${styles.input} ${error ? styles.inputInvalid : ''}`}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className={styles.fieldError} role="alert">
          <AlertCircle size={14} /> {error}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. NiralStepProgress                                                       */
/* -------------------------------------------------------------------------- */
export function NiralStepProgress({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}) {
  return (
    <nav className={styles.stepProgress} aria-label="Registration steps">
      {steps.map((stepName, idx) => {
        const isActive = idx === currentStep;
        const isComplete = idx < currentStep;
        return (
          <button
            key={stepName}
            type="button"
            className={styles.stepButton}
            disabled={idx > currentStep || !onStepClick}
            onClick={() => onStepClick && onStepClick(idx)}
            aria-current={isActive ? 'step' : undefined}
          >
            <span
              className={`${styles.stepBar} ${
                isActive
                  ? styles.stepBarActive
                  : isComplete
                    ? styles.stepBarComplete
                    : ''
              }`}
            />
            <span
              className={`${styles.stepLabel} ${
                isActive ? styles.stepLabelActive : ''
              }`}
            >
              {idx + 1}. {stepName}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. NiralFormAlert                                                          */
/* -------------------------------------------------------------------------- */
export function NiralFormAlert({
  message,
  variant = 'error',
}: {
  message?: string | null;
  variant?: 'error' | 'info' | 'success';
}) {
  if (!message) return null;

  const isError = variant === 'error';
  const isSuccess = variant === 'success';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`${styles.alertBox} ${
        isError
          ? styles.alertError
          : isSuccess
            ? styles.alertSuccess
            : styles.alertInfo
      }`}
    >
      <div className={styles.alertIcon}>
        {isError ? (
          <AlertCircle size={18} />
        ) : isSuccess ? (
          <CheckCircle2 size={18} />
        ) : (
          <Info size={18} />
        )}
      </div>
      <div>{message}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. NiralSuccessState                                                       */
/* -------------------------------------------------------------------------- */
export function NiralSuccessState({
  title,
  message,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  message: string;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className={styles.successWrapper}>
      <div className={styles.successIconBadge}>
        <CheckCircle2 size={36} color="#15803D" />
      </div>
      <h2 className={styles.successTitle}>{title}</h2>
      <p className={styles.successMessage}>{message}</p>
      {(primaryAction || secondaryAction) && (
        <div className={styles.successActions}>
          {primaryAction && (
            <PopButton
              href={primaryAction.href}
              onClick={primaryAction.onClick}
              className={styles.authSubmitButton}
            >
              {primaryAction.label}
            </PopButton>
          )}
          {secondaryAction && (
            <PopButton
              cream
              href={secondaryAction.href}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </PopButton>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. NiralPasswordStrength                                                   */
/* -------------------------------------------------------------------------- */
export function NiralPasswordStrength({ password }: { password: string }) {
  const errors = validatePasswordPolicy(password);
  const score = password ? Math.max(0, 4 - errors.length) : 0;

  return (
    <div className={styles.strengthMeter}>
      <div className={styles.strengthBars} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`${styles.strengthBar} ${
              i < score ? styles.strengthBarFilled : ''
            }`}
          />
        ))}
      </div>
      <span className={styles.strengthText} aria-live="polite">
        {!password
          ? 'Must be at least 12 characters with uppercase, lowercase, and a number.'
          : errors.length
            ? errors[0]
            : 'Strong password requirement met.'}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. NiralChipSelect                                                        */
/* -------------------------------------------------------------------------- */
export function NiralChipSelect({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onChange: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className={styles.chipsGrid}>
      {options.map((opt) => {
        const isSelected = multi
          ? Array.isArray(selected) && selected.includes(opt)
          : selected === opt;

        return (
          <button
            key={opt}
            type="button"
            className={`${styles.chipButton} ${
              isSelected ? styles.chipButtonActive : ''
            }`}
            aria-pressed={isSelected}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. NiralAuthLayout                                                        */
/* -------------------------------------------------------------------------- */
export function NiralAuthLayout({
  children,
  actionType = 'login',
  kicker = 'NIRAL 2026 · SECURE ACCESS',
  headlineTitle = 'Welcome back to',
  headlineHighlight = 'NIRAL.',
  description = 'Sign in to continue your innovation journey.',
}: {
  children: ReactNode;
  actionType?: 'login' | 'register' | 'none';
  kicker?: string;
  headlineTitle?: string;
  headlineHighlight?: string;
  description?: string;
}) {
  return (
    <div className={styles.root}>
      <a href="#auth-card" className={styles.skipLink}>
        Skip to form
      </a>

      {/* Header */}
      <NiralAuthHeader actionType={actionType} />

      {/* Main Two-Column Layout */}
      <main className={styles.mainLayout}>
        {/* Left Column: Welcome & Illustration */}
        <section
          className={styles.leftColumn}
          aria-label="NIRAL Hackathon 2026 event details"
        >
          <div className={styles.kickerPill}>
            <span className={styles.kickerDot} />
            <span>{kicker}</span>
          </div>

          <h2 className={styles.headline}>
            {headlineTitle}{' '}
            {headlineHighlight && <mark>{headlineHighlight}</mark>}
          </h2>

          <p className={styles.description}>{description}</p>

          <NiralAuthIllustration />

          {/* Verified Event Metadata Card */}
          <div className={styles.eventMetaCard}>
            <div className={styles.eventMetaItem}>
              <div className={styles.eventMetaIcon}>
                <CalendarDays size={18} color="#111" />
              </div>
              <div className={styles.eventMetaText}>
                <strong>DECEMBER 3–4, 2026</strong>
                <span>Verified Event Dates · 36 Hours</span>
              </div>
            </div>

            <div className={styles.eventMetaItem}>
              <div className={styles.eventMetaIcon}>
                <MapPin size={18} color="#111" />
              </div>
              <div className={styles.eventMetaText}>
                <strong>SRI SHAKTHI INSTITUTE</strong>
                <span>Engineering &amp; Tech, Coimbatore</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Auth Card */}
        <div id="auth-card" tabIndex={-1} style={{ outline: 'none' }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/rules">Event Rules</Link>
          <Link href="/contact">Contact Support</Link>
        </div>
        <div className={styles.footerMeta}>
          <span>NIRAL HACKATHON 2026</span>
          <span>·</span>
          <span>SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY</span>
        </div>
      </footer>
    </div>
  );
}

