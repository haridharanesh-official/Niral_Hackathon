'use client';

import Link from 'next/link';
import { PaymentSummary } from '@/components/payments/payment-summary';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  MapPin,
  Clock,
  Copy,
  Check,
  Users,
  AlertCircle,
  CheckCircle2,
  Bell,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Award,
  BookOpen,
} from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/dashboard/participant-portal.module.css';

type DashboardSummary = {
  userSummary?: {
    id: string;
    name: string;
    email: string;
    role: string;
    xp: number;
    college?: string | null;
    department?: string | null;
    profile?: Record<string, unknown> | null;
    profileCompletedAt?: string | null;
  } | null;
  event?: {
    id: string;
    name: string;
    startsAt: string;
    hasExactTimes?: boolean;
    endsAt: string;
    venueName?: string | null;
    venueAddress?: string | null;
    timezone?: string;
    eventMode?: string;
    minTeamSize?: number;
    maxTeamSize?: number;
    settings?: { tracks?: string[] };
  } | null;
  enrollment?: {
    id: string;
    registrationId: string;
    status: string;
    mode: string;
    createdAt: string;
    applicationData?: Record<string, unknown>;
  } | null;
  teamOverview?: {
    id: string;
    name: string;
    status: string;
    inviteCode: string;
    theme?: string | null;
    leaderId?: string | null;
    members: Array<{
      role: string;
      user: {
        id: string;
        name: string;
        college?: string | null;
        department?: string | null;
        xp?: number;
      };
    }>;
  } | null;
  latestAnnouncements?: Array<{
    id: string;
    title: string;
    body: string;
    priority: string;
    createdAt: string;
    read: boolean;
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
};

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const first = name?.split(' ')[0] ?? 'Participant';
  if (hour < 12) return `Good Morning, ${first}`;
  if (hour < 17) return `Good Afternoon, ${first}`;
  return `Good Evening, ${first}`;
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRegId, setCopiedRegId] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setData(null);
      }
    });

    accountRequest<DashboardSummary>('summary')
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message ?? 'Failed to load dashboard data');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const user = data?.userSummary;
  const enrollment = data?.enrollment;
  const team = data?.teamOverview;
  const event = data?.event;
  const announcements = data?.latestAnnouncements ?? [];
  const notifications = data?.notifications ?? [];

  // Profile completion calculation
  const profileSteps = [
    { label: 'Basic Account Details', done: Boolean(user?.name && user?.email) },
    { label: 'Academic Details', done: Boolean(user?.college && user?.department) },
    {
      label: 'Skills & Track Interests',
      done: Boolean(
        user?.profile?.skills && Object.keys(user?.profile?.skills).length > 0,
      ),
    },
    { label: 'Event Application', done: Boolean(enrollment?.registrationId) },
  ];
  const completedSteps = profileSteps.filter((s) => s.done).length;
  const profilePercent = Math.round((completedSteps / profileSteps.length) * 100);

  // Use the authoritative event date; do not invent a kickoff time.
  const eventDate = event?.startsAt ? new Date(event.startsAt) : null;
  const now = new Date();
  const daysRemaining =
    eventDate && Number.isFinite(eventDate.getTime())
      ? Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / 86400000))
      : null;

  const statusLabels: Record<string, { text: string; className: string }> = {
    CONFIRMED: { text: 'Confirmed', className: styles.badgeSuccess },
    PENDING: { text: 'Pending confirmation', className: styles.badgeWarning },
    WAITLISTED: { text: 'Waitlisted', className: styles.badgeNeutral },
    REJECTED: { text: 'Not Selected', className: styles.badgeNeutral },
  };

  const currentStatus = enrollment
    ? (statusLabels[enrollment.status] ?? {
        text: enrollment.status,
        className: styles.badgeNeutral,
      })
    : null;

  function copyText(text: string, type: 'code' | 'reg') {
    void navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedRegId(true);
      setTimeout(() => setCopiedRegId(false), 2000);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Banner / Welcome Header */}
      <div className={styles.headingWrapper}>
        <span className={styles.eyebrow}>Participant Command Center</span>
        <h1 className={styles.portalTitle}>
          {getGreeting(session?.user?.name ?? undefined)}, <mark>welcome back.</mark>
        </h1>
        <p className={styles.portalSubtitle}>
          NIRAL Hackathon 2026 · December 3–4, 2026 at Sri Shakthi Institute of
          Engineering and Technology, Coimbatore.
        </p>
      </div>

      {error && (
        <div
          className={styles.card}
          style={{ background: '#fff0e9', borderColor: '#fd9b9b', color: '#900' }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <strong>Unable to load live dashboard: {error}</strong>
          </div>
        </div>
      )}

      {/* Top Stats Strip (Tactile Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
        }}
      >
        {/* Registration ID Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
              Registration ID
            </span>
            {currentStatus && (
              <span className={`${styles.badge} ${currentStatus.className}`}>
                {currentStatus.text}
              </span>
            )}
          </div>
          {enrollment?.registrationId ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontFamily: 'Space Grotesk', fontSize: 20 }}>
                {enrollment.registrationId}
              </strong>
              <button
                type="button"
                onClick={() => copyText(enrollment.registrationId, 'reg')}
                style={{
                  border: '1.5px solid #111',
                  background: copiedRegId ? '#c3e6cb' : '#faf7f2',
                  padding: '5px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
                title="Copy Registration ID"
              >
                {copiedRegId ? <Check size={14} /> : <Copy size={14} />}
                {copiedRegId ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
                No active application submitted yet.
              </p>
              <PopButton href="/apply" style={{ padding: '6px 14px', fontSize: 13 }}>
                Apply to NIRAL →
              </PopButton>
            </div>
          )}
        </div>

        {/* Team Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
              Team Status
            </span>
            <span
              className={`${styles.badge} ${team ? styles.badgeCoral : styles.badgeNeutral}`}
            >
              {team ? `${team.members.length} / 4 Members` : 'No Team'}
            </span>
          </div>
          {team ? (
            <div>
              <strong
                style={{ fontFamily: 'Space Grotesk', fontSize: 19, display: 'block' }}
              >
                {team.name}
              </strong>
              <span style={{ fontSize: 12, color: '#666' }}>
                Track: {team.theme ?? 'General Emerging Tech'}
              </span>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
                Teams must have 2–4 verified members.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <PopButton
                  href="/dashboard/team"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  Create Team
                </PopButton>
                <PopButton
                  href="/dashboard/team"
                  cream
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  Join Team
                </PopButton>
              </div>
            </div>
          )}
        </div>

        {/* Days to Hackathon Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
              Kickoff Countdown
            </span>
            <span className={`${styles.badge} ${styles.badgeCoral}`}>December 3–4</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <strong style={{ fontFamily: 'Space Grotesk', fontSize: 32, lineHeight: 1 }}>
              {daysRemaining ?? 'TBA'}
            </strong>
            <span style={{ fontSize: 14, color: '#666' }}>
              Days remaining until onsite kickoff
            </span>
          </div>
        </div>

        {/* Profile Completion Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>
              Profile Readiness
            </span>
            <span
              className={`${styles.badge} ${profilePercent === 100 ? styles.badgeSuccess : styles.badgeWarning}`}
            >
              {profilePercent}% Ready
            </span>
          </div>
          <div
            style={{
              background: '#faf7f2',
              border: '1.5px solid #111',
              borderRadius: 8,
              height: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: profilePercent === 100 ? '#28a745' : '#fd9b9b',
                height: '100%',
                width: `${profilePercent}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
            }}
          >
            <span style={{ color: '#666' }}>
              {completedSteps} of {profileSteps.length} milestones complete
            </span>
            <Link
              href="/dashboard/profile"
              style={{ textDecoration: 'underline', fontWeight: 600 }}
            >
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      <PaymentSummary />
      {/* Main Grid: Application & Team Details + Announcements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
        }}
      >
        {/* Left Column: Essential Next Steps & Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Important Next Steps Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Sparkles size={20} style={{ color: '#fd9b9b' }} />
                Important Next Steps
              </h2>
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle2
                  size={18}
                  style={{ color: '#28a745', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <strong>Email &amp; Identity Verified</strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    Authenticated session active for {session?.user?.email}.
                  </p>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {enrollment ? (
                  <CheckCircle2
                    size={18}
                    style={{ color: '#28a745', flexShrink: 0, marginTop: 2 }}
                  />
                ) : (
                  <AlertCircle
                    size={18}
                    style={{ color: '#fd9b9b', flexShrink: 0, marginTop: 2 }}
                  />
                )}
                <div>
                  <strong>Official NIRAL Application</strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {enrollment
                      ? `Application recorded (${enrollment.registrationId}). Mode: Onsite.`
                      : 'Complete and submit your registration details to receive your registration ID.'}
                  </p>
                  <Link
                    href="/dashboard/application"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      textDecoration: 'underline',
                      color: '#111',
                    }}
                  >
                    View application details →
                  </Link>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {team && team.members.length >= 2 ? (
                  <CheckCircle2
                    size={18}
                    style={{ color: '#28a745', flexShrink: 0, marginTop: 2 }}
                  />
                ) : (
                  <AlertCircle
                    size={18}
                    style={{ color: '#fd9b9b', flexShrink: 0, marginTop: 2 }}
                  />
                )}
                <div>
                  <strong>Squad Formation (2–4 Members)</strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {team
                      ? `Active team "${team.name}" has ${team.members.length} members.`
                      : 'Every participant must form or join a squad before the deadline.'}
                  </p>
                  <Link
                    href="/dashboard/team"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      textDecoration: 'underline',
                      color: '#111',
                    }}
                  >
                    Manage team workspace →
                  </Link>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Clock size={18} style={{ color: '#666', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Onsite Physical Check-in</strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    Report to Sri Shakthi Institute on Dec 3, 2026 by 08:30 AM with your
                    college ID card.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Event Information Card */}
          <div className={`${styles.card} ${styles.cardPaper}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <MapPin size={20} style={{ color: '#fd9b9b' }} />
                Venue &amp; Official Details
              </h2>
            </div>
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '8px 12px',
                fontSize: 13.5,
                margin: 0,
              }}
            >
              <dt style={{ fontWeight: 700, color: '#666' }}>Event</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>NIRAL Hackathon 2026</dd>

              <dt style={{ fontWeight: 700, color: '#666' }}>Official Dates</dt>
              <dd style={{ margin: 0 }}>December 3–4, 2026</dd>

              <dt style={{ fontWeight: 700, color: '#666' }}>Venue</dt>
              <dd style={{ margin: 0 }}>
                Sri Shakthi Institute of Engineering and Technology, L&amp;T By-Pass,
                Chinniyampalayam Post, Coimbatore - 641062
              </dd>

              <dt style={{ fontWeight: 700, color: '#666' }}>Format</dt>
              <dd style={{ margin: 0 }}>36-Hour Continuous Onsite Hackathon</dd>

              <dt style={{ fontWeight: 700, color: '#666' }}>Official Email</dt>
              <dd style={{ margin: 0 }}>
                <a
                  href="mailto:iotclub.siet@gmail.com"
                  style={{ textDecoration: 'underline' }}
                >
                  iotclub.siet@gmail.com
                </a>
              </dd>

              <dt style={{ fontWeight: 700, color: '#666' }}>Helpdesk</dt>
              <dd style={{ margin: 0 }}>+91 8508511975</dd>
            </dl>
          </div>
        </div>

        {/* Right Column: Latest Announcements & Team Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Latest Announcements Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Bell size={20} style={{ color: '#fd9b9b' }} />
                Official Announcements
              </h2>
              <Link
                href="/dashboard/announcements"
                style={{ fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}
              >
                View all bulletins →
              </Link>
            </div>

            {announcements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      border: '1.5px solid #111',
                      borderRadius: 10,
                      padding: '12px 14px',
                      background: ann.priority === 'urgent' ? '#ffe2db' : '#faf7f2',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <strong style={{ fontSize: 14.5 }}>{ann.title}</strong>
                      {ann.priority === 'urgent' && (
                        <span
                          className={`${styles.badge} ${styles.badgeUrgent}`}
                          style={{ fontSize: 10 }}
                        >
                          Urgent
                        </span>
                      )}
                    </div>
                    <p
                      style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}
                    >
                      {ann.body}
                    </p>
                    <small
                      style={{
                        display: 'block',
                        marginTop: 6,
                        fontSize: 11,
                        color: '#777',
                      }}
                    >
                      {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#666' }}>
                No announcements published yet.
              </p>
            )}
          </div>

          {/* Quick Team Roster Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Users size={20} style={{ color: '#fd9b9b' }} />
                Your Squad Roster
              </h2>
              <Link
                href="/dashboard/team"
                style={{ fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}
              >
                Open Workspace →
              </Link>
            </div>

            {team ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 16 }}>{team.name}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Invite Code: <code>{team.inviteCode}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(team.inviteCode, 'code')}
                    style={{
                      border: '1.5px solid #111',
                      background: copiedCode ? '#c3e6cb' : '#faf7f2',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {team.members.map((member) => (
                    <div
                      key={member.user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        border: '1.5px solid #111',
                        borderRadius: 8,
                        background: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: '#fd9b9b',
                            border: '1px solid #111',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {member.user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {member.user.name}
                        </span>
                      </div>
                      <span
                        className={`${styles.badge} ${
                          member.role === 'LEADER'
                            ? styles.badgeCoral
                            : styles.badgeNeutral
                        }`}
                        style={{ fontSize: 10, padding: '2px 8px' }}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 13.5, color: '#555', marginBottom: 14 }}>
                  You are not yet a member of any squad. Recruit or join teammates to
                  begin prototyping.
                </p>
                <PopButton href="/dashboard/team">Go to Team Workspace →</PopButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
