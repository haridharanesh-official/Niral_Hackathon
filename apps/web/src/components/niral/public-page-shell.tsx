'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Youtube,
  Instagram,
  Linkedin,
  Github,
} from 'lucide-react';
import { PopButton } from './pop-button';
import { MobileMenu } from './home-interactions';
import styles from './niral.module.css';
import publicStyles from './public-pages.module.css';

export const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Participate', href: '/participate' },
  { name: 'Tracks', href: '/tracks' },
  { name: 'Problems', href: '/problems' },
  { name: 'Schedule', href: '/schedule' },
  { name: 'Rules', href: '/rules' },
  { name: 'Updates', href: '/updates' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="NIRAL Hackathon 2026 home">
      <span>N</span>
      <div>
        <strong>NIRAL</strong>
        <small>HACKATHON 2026</small>
      </div>
    </Link>
  );
}

export function PublicPageShell({
  children,
  activeRoute,
  showInfoStrip = true,
}: {
  children: ReactNode;
  activeRoute?: string;
  showInfoStrip?: boolean;
}) {
  const pathname = usePathname();
  const current = activeRoute || pathname;

  return (
    <div className={styles.root}>
      <a className={styles.skip} href="#niral-main">
        Skip to content
      </a>

      {/* Header */}
      <header className={styles.header}>
        <Logo />
        <nav aria-label="Main navigation" className={styles.desktopNav}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? current === '/'
                : current.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? publicStyles.activeNavLink : undefined}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className={styles.headerActions}>
          <PopButton href="/login" cream>
            Sign In
          </PopButton>
          <PopButton href="/register">Register</PopButton>
        </div>
        <MobileMenu />
      </header>

      {/* Main Content */}
      <main id="niral-main" className={styles.main}>
        {children}
      </main>

      {/* Verified Info Strip */}
      {showInfoStrip && (
        <div className={publicStyles.infoStripContainer}>
          <div className={styles.information}>
            <div>
              <CalendarDays />
              <span>December 3–4, 2026</span>
            </div>
            <Link href="/contact">
              <MapPin />
              <span>Sri Shakthi Institute of Engineering and Technology</span>
            </Link>
            <a href="mailto:iotclub.siet@gmail.com">
              <Mail />
              <span>iotclub.siet@gmail.com</span>
            </a>
            <a href="tel:+918508511975">
              <Phone />
              <span>+91 8508511975</span>
            </a>
          </div>
        </div>
      )}

      {/* Comprehensive Tactile Footer */}
      <footer className={publicStyles.enhancedFooter}>
        <div className={publicStyles.footerTopRow}>
          <Logo />
          <nav aria-label="Footer navigation" className={publicStyles.footerNav}>
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className={publicStyles.socialIcons}>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NIRAL on YouTube"
              className={publicStyles.socialBtn}
            >
              <Youtube size={17} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NIRAL on Instagram"
              className={publicStyles.socialBtn}
            >
              <Instagram size={17} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NIRAL on LinkedIn"
              className={publicStyles.socialBtn}
            >
              <Linkedin size={17} />
            </a>
            <a
              href="https://github.com/haridharanesh-official/Niral_Hackathon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NIRAL Repository on GitHub"
              className={publicStyles.socialBtn}
            >
              <Github size={17} />
            </a>
          </div>
        </div>

        <div className={publicStyles.footerBottomBar}>
          <p>© 2026 NIRAL Hackathon. All rights reserved.</p>
          <p>
            Organized by IoT Club, Sri Shakthi Institute of Engineering and
            Technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
