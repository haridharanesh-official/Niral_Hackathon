import Link from 'next/link';
import type { ReactNode } from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import { Logo } from '@/components/niral/public-page-shell';
import publicStyles from '@/components/niral/niral.module.css';
import { type AuthStory } from './auth-terminal';
import { Interactive3DArtwork } from '@/components/auth/interactive-3d-artwork';
import styles from './auth.module.css';
export function AuthLayout({
  children,
  story,
  status,
}: {
  children: ReactNode;
  story: AuthStory;
  status?: string;
}) {
  return (
    <div className={`${publicStyles.root} ${styles.root}`}>
      <a href="#auth-form" className={styles.skip}>
        Skip to form
      </a>
      <header className={styles.header}>
        <Logo />
        <nav className={styles.headerLinks} aria-label="Authentication navigation">
          <Link href="/">Home</Link>
          <Link href="/rules">Event rules</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </header>
      <main id="auth-main" className={styles.layout}>
        <aside className={styles.creative} aria-label="NIRAL Hackathon 2026">
          <span className={styles.kicker}>STUDENTS · INNOVATION · DEC 3–4</span>
          <h2>
            Make something
            <br />
            <mark>extraordinary.</mark>
          </h2>
          <p>
            Turn meaningful ideas into real-world prototypes. Your NIRAL journey starts
            with a secure participant account.
          </p>
          <Interactive3DArtwork />
          <div className={styles.creativeBottom}>
            <span>Students first</span>
            <span>Ideas into impact</span>
            <span>Build together</span>
          </div>
        </aside>
        <div className={styles.formArea}>
          <section id="auth-form" tabIndex={-1} className={styles.formCard} data-auth-story={story}>
            {children}
            <p className={styles.hint} role="status">
              {status}
            </p>
          </section>
        </div>
      </main>
      <footer className={styles.footer}>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-of-service">Terms of Service</Link>
        <span>NIRAL HACKATHON 2026</span>
        <span>· DECEMBER 3–4, 2026</span>
        <span>· SRI SHAKTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY</span>
      </footer>
    </div>
  );
}
export function AuthHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
}) {
  return (
    <>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 className={styles.title} tabIndex={-1}>
        {title}
        {highlight && <mark>{highlight}</mark>}
      </h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </>
  );
}
