'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Users2,
  BellRing,
  UserCheck2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
} from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { Logo } from '@/components/niral/public-page-shell';
import styles from './participant-portal.module.css';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role ?? 'PARTICIPANT';

  const navLinks = useMemo(() => {
    const links = [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/application', label: 'Application', icon: FileCheck2 },
      { href: '/dashboard/payments', label: 'Payments', icon: FileCheck2 },
      { href: '/dashboard/team', label: 'Team', icon: Users2 },
      { href: '/dashboard/announcements', label: 'Announcements', icon: BellRing },
      { href: '/dashboard/profile', label: 'Profile', icon: UserCheck2 },
    ];

    if (role === 'ADMIN')
      links.push({
        href: '/admin/payments',
        label: 'Payment Controls',
        icon: ShieldCheck,
      });
    if (role === 'ADMIN' || role === 'ORGANIZER') {
      links.push({
        href: '/organizer',
        label: 'Organizer Console',
        icon: ShieldCheck,
      });
    } else if (role === 'JUDGE') {
      links.push({
        href: '/judge',
        label: 'Judge Panel',
        icon: ShieldCheck,
      });
    } else if (role === 'VOLUNTEER') {
      links.push({
        href: '/volunteer',
        label: 'Volunteer Desk',
        icon: ShieldCheck,
      });
    }

    return links;
  }, [role]);

  const initials = useMemo(() => {
    const name = session?.user?.name ?? 'Participant';
    return name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [session?.user?.name]);

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Participant';

  function handleSignOut() {
    try {
      sessionStorage.clear();
      // Remove any residual local storage items
      for (const k of [
        'hackos.dashboard.summary.cache',
        'hackos.dashboard.tasks',
        'hackos.dashboard.tasks.queue',
        'hackos.dashboard.widgets',
        'hackos.search.recent',
        'niral.application.emailDelivery',
      ]) {
        localStorage.removeItem(k);
      }
    } catch {
      /* ignore storage clear error */
    }
    void signOut({ callbackUrl: '/' });
  }

  return (
    <div className={styles.portalRoot}>
      {/* Top Header */}
      <header className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <Logo />
          <nav aria-label="Participant portal navigation" className={styles.portalNav}>
            {navLinks.map((link) => {
              const isActive =
                link.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={16} />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.headerRight}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
            style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="Open public event website"
          >
            <span>Public Site</span>
            <ExternalLink size={13} />
          </Link>

          <Link
            href="/dashboard/profile"
            className={styles.userPill}
            title="View and edit profile"
          >
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{firstName}</span>
              <span className={styles.userRole}>
                {role === 'TEAM_LEADER' ? 'Team Leader' : role.toLowerCase()}
              </span>
            </div>
          </Link>

          <PopButton
            cream
            onClick={handleSignOut}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} />
              Sign Out
            </span>
          </PopButton>

          <button
            type="button"
            className={styles.mobileMenuBtn}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawer} onClick={() => setMobileOpen(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.userAvatar}>{initials}</div>
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{firstName}</strong>
                  <small
                    style={{ color: '#666', textTransform: 'uppercase', fontSize: 11 }}
                  >
                    {role}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navLinks.map((link) => {
                const isActive =
                  link.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: 15 }}>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div
              style={{ marginTop: 'auto', borderTop: '2px solid #111', paddingTop: 16 }}
            >
              <PopButton
                cream
                onClick={handleSignOut}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                Sign Out
              </PopButton>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="niral-dashboard-main" className={styles.portalMain}>
        {children}
      </main>

      {/* Verified Footer / Event Info Strip */}
      <footer className={styles.portalFooter}>
        <div className={styles.footerLeft}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} style={{ color: '#fd9b9b' }} />
            <strong>December 3–4, 2026</strong>
          </span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} style={{ color: '#fd9b9b' }} />
            <span>Sri Shakthi Institute of Engineering and Technology, Coimbatore</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <span>iotclub.siet@gmail.com</span>
          <span>·</span>
          <span>+91 8508511975</span>
          <span>·</span>
          <a
            href="https://github.com/haridharanesh-official/Niral_Hackathon"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
