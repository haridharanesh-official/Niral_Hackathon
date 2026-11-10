import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import {
  NiralAuthLayout,
  NiralAuthCard,
} from '@/components/niral-auth/niral-auth-system';
import { PopButton } from '@/components/niral/pop-button';
import { ShieldCheck, Users, Award, ClipboardCheck, ArrowRight } from 'lucide-react';
import styles from '@/components/niral-auth/niral-auth.module.css';

export const metadata: Metadata = {
  title: 'Select Workspace · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default async function RolesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?next=/login/roles');
  }

  const role = session.user.role;

  // Single-role users are directed directly to their workspace
  if (role === 'PARTICIPANT' || role === 'TEAM_LEADER' || role === 'VISITOR') {
    redirect('/dashboard');
  }

  // Multi-portal options for server-authorized privileged roles
  const portals = [
    {
      id: 'participant',
      title: 'Participant Dashboard',
      description: 'View teams, project submissions, problem statements, and general event hub.',
      href: '/dashboard',
      icon: Users,
      badge: 'All Participants',
    },
  ];

  if (role === 'ADMIN') {
    portals.unshift(
      {
        id: 'admin',
        title: 'Admin Master Console',
        description: 'System administration, user roles, security audits, and global platform controls.',
        href: '/master',
        icon: ShieldCheck,
        badge: 'Authorized: ADMIN',
      },
      {
        id: 'organizer',
        title: 'Organizer Hub',
        description: 'Manage event operations, schedules, judging rounds, hardware, and announcements.',
        href: '/organizer',
        icon: ClipboardCheck,
        badge: 'Authorized: ORGANIZER',
      },
    );
  } else if (role === 'ORGANIZER') {
    portals.unshift({
      id: 'organizer',
      title: 'Organizer Hub',
      description: 'Manage event operations, schedules, judging rounds, hardware, and announcements.',
      href: '/organizer',
      icon: ClipboardCheck,
      badge: 'Authorized: ORGANIZER',
    });
  } else if (role === 'JUDGE') {
    portals.unshift({
      id: 'judge',
      title: 'Judge Evaluation Portal',
      description: 'Review project submissions, assign scores, and submit rubric evaluations.',
      href: '/judge',
      icon: Award,
      badge: 'Authorized: JUDGE',
    });
  } else if (role === 'VOLUNTEER') {
    portals.unshift({
      id: 'volunteer',
      title: 'Volunteer Operations Desk',
      description: 'Participant check-in, venue coordination, food tokens, and helpdesk support.',
      href: '/volunteer',
      icon: ClipboardCheck,
      badge: 'Authorized: VOLUNTEER',
    });
  } else if (role === 'MENTOR') {
    portals.unshift({
      id: 'mentor',
      title: 'Mentor Office Hours',
      description: 'Guide participant teams, provide technical feedback, and review hardware architectures.',
      href: '/dashboard/mentor',
      icon: Users,
      badge: 'Authorized: MENTOR',
    });
  }

  return (
    <NiralAuthLayout
      actionType="none"
      kicker="NIRAL 2026 · ROLE SELECTION"
      headlineTitle="Select your"
      headlineHighlight="workspace."
      description="Your authenticated account has multiple portal privileges. Select which workspace you would like to open."
    >
      <NiralAuthCard
        eyebrow="MULTI-ROLE ACCESS"
        title="Select Workspace"
        subtitle={`Signed in as ${session.user.name || session.user.email} (${role})`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={styles.reviewCard}
                style={{ background: '#ffffff', transition: 'transform 0.15s ease' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      border: '2px solid #111',
                      background: portal.id === 'participant' ? '#FAF7F2' : '#FD9B9B',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 3px 0 #111',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color="#111" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: '#111' }}>{portal.title}</strong>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#FFE2DB',
                          border: '1px solid #111',
                          borderRadius: 12,
                          padding: '2px 8px',
                        }}
                      >
                        {portal.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#696969', margin: '4px 0 12px', lineHeight: 1.5 }}>
                      {portal.description}
                    </p>
                    <PopButton href={portal.href} cream={portal.id === 'participant'} style={{ width: '100%' }}>
                      Open {portal.title} <ArrowRight size={14} />
                    </PopButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.cardFooterLinks} style={{ marginTop: 12 }}>
          <span>Need to switch accounts?</span>
          <Link href="/api/auth/signout">Sign Out</Link>
        </div>
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}
