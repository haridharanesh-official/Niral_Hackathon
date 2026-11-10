'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Megaphone,
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/dashboard/participant-portal.module.css';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'urgent' | 'normal' | 'low' | string;
  published: boolean;
  createdAt: string;
  read: boolean;
}

export default function ParticipantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountRequest<Announcement[]>('announcements');
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (cause) {
      setAnnouncements([]);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Announcements unavailable. Please retry.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAnnouncements();
    });
  }, [fetchAnnouncements]);

  const handleMarkRead = async (id: string) => {
    setActionInProgress(id);
    try {
      await accountRequest('announcement-read', { id }, 'POST');
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
      );
    } catch {
      setError('Could not mark this announcement read. Please retry.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAllRead = async () => {
    setActionInProgress('all');
    try {
      await accountRequest('announcements-read-all', {}, 'POST');
      setAnnouncements((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch {
      setError('Could not mark announcements read. Please retry.');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    if (filter === 'unread') return !item.read;
    if (filter === 'urgent') return item.priority === 'urgent';
    return true;
  });

  const unreadCount = announcements.filter((a) => !a.read).length;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}
      {/* Header Banner */}
      <div
        className={styles.card}
        style={{
          background: 'linear-gradient(135deg, #fff 0%, #faf7f2 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div className={styles.heroKicker}>
              <Megaphone size={14} color="#111" />
              <span>Official Communications</span>
            </div>
            <h1 className={styles.portalTitle} style={{ marginTop: 6 }}>
              NIRAL <mark>Announcements</mark> & Briefings
            </h1>
            <p className={styles.portalSubtitle}>
              Stay synchronized with organizing committee notices, track updates, deadline
              alerts, and venue logistics for December 3–4, 2026.
            </p>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          >
            <button
              type="button"
              onClick={fetchAnnouncements}
              disabled={loading}
              title="Refresh notices"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: '#fff',
                border: '1.5px solid #111',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '2px 2px 0 #111',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && (
              <PopButton
                onClick={handleMarkAllRead}
                disabled={actionInProgress === 'all'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <CheckCheck size={16} />
                <span>Mark All Read ({unreadCount})</span>
              </PopButton>
            )}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderTop: '1.5px solid #eaeaea',
            paddingTop: 16,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: filter === 'all' ? 700 : 500,
              border: '1.5px solid #111',
              background: filter === 'all' ? '#111' : '#fff',
              color: filter === 'all' ? '#fff' : '#111',
              cursor: 'pointer',
              boxShadow: filter === 'all' ? '0 2px 0 #111' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            All Notices ({announcements.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: filter === 'unread' ? 700 : 500,
              border: '1.5px solid #111',
              background: filter === 'unread' ? 'var(--niral-coral)' : '#fff',
              color: '#111',
              cursor: 'pointer',
              boxShadow: filter === 'unread' ? '0 2px 0 #111' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('urgent')}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: filter === 'urgent' ? 700 : 500,
              border: '1.5px solid #111',
              background: filter === 'urgent' ? '#ffdede' : '#fff',
              color: filter === 'urgent' ? '#900' : '#111',
              cursor: 'pointer',
              boxShadow: filter === 'urgent' ? '0 2px 0 #111' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Urgent Briefings (
            {announcements.filter((a) => a.priority === 'urgent').length})
          </button>
        </div>
      </div>

      {/* Main Grid: Announcements List (2 cols) + Resource Sidebar (1 col) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Announcements Stream */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            gridColumn: 'span 2',
          }}
        >
          {loading && announcements.length === 0 ? (
            <div
              className={styles.card}
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--niral-muted)',
              }}
            >
              <RefreshCw
                size={28}
                className="animate-spin"
                style={{ margin: '0 auto 12px' }}
              />
              <p style={{ fontWeight: 600 }}>Loading official announcements...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div
              className={styles.card}
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'var(--niral-paper)',
              }}
            >
              <CheckCheck size={36} color="#155724" style={{ margin: '0 auto 12px' }} />
              <h3
                style={{
                  fontFamily: 'Space Grotesk, Arial, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {filter === 'unread' ? 'All caught up!' : 'No notices match this filter'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--niral-muted)', marginTop: 6 }}>
                {filter === 'unread'
                  ? 'You have reviewed all official broadcasts published so far.'
                  : 'Check back later or switch filter to view all broadcasts.'}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                className={styles.card}
                style={{
                  borderLeft:
                    item.priority === 'urgent'
                      ? '6px solid #fd9b9b'
                      : !item.read
                        ? '6px solid #111'
                        : '2px solid var(--niral-border)',
                  background: item.read ? '#fff' : '#fffdfa',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    {item.priority === 'urgent' ? (
                      <span className={`${styles.badge} ${styles.badgeUrgent}`}>
                        <AlertTriangle size={12} />
                        Urgent Notice
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>
                        <Bell size={12} />
                        Official Broadcast
                      </span>
                    )}

                    {!item.read && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#b00',
                          background: '#ffe5e5',
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid #ffd0d0',
                        }}
                      >
                        ● New
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--niral-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={12} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {!item.read ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      disabled={actionInProgress === item.id}
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #111',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCheck size={13} />
                      <span>Mark Read</span>
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#888',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCheck size={13} color="#2b8a3e" />
                      <span>Read</span>
                    </span>
                  )}
                </div>

                <h2
                  style={{
                    fontFamily: 'Space Grotesk, Arial, sans-serif',
                    fontSize: 19,
                    fontWeight: 700,
                    marginTop: 12,
                    marginBottom: 8,
                    color: 'var(--niral-ink)',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h2>

                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: '#333',
                    margin: '8px 0 16px',
                  }}
                >
                  {item.body}
                </p>

                {/* Contextual links matching announcement theme */}
                {item.title.toLowerCase().includes('track') ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      paddingTop: 10,
                      borderTop: '1px dashed #e0e0e0',
                    }}
                  >
                    <Link
                      href="/tracks"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#111',
                        textDecoration: 'underline',
                      }}
                    >
                      Explore Problem Tracks
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : item.title.toLowerCase().includes('team') ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      paddingTop: 10,
                      borderTop: '1px dashed #e0e0e0',
                    }}
                  >
                    <Link
                      href="/dashboard/team"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#111',
                        textDecoration: 'underline',
                      }}
                    >
                      Manage Team Workspace
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : item.title.toLowerCase().includes('venue') ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      paddingTop: 10,
                      borderTop: '1px dashed #e0e0e0',
                    }}
                  >
                    <Link
                      href="/schedule"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#111',
                        textDecoration: 'underline',
                      }}
                    >
                      View Hackathon Timeline
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Event Reference & Assistance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logistics Summary */}
          <div className={`${styles.card} ${styles.cardPaper}`}>
            <h3 className={styles.cardTitle}>
              <MapPin size={18} color="var(--niral-coral)" />
              Event Logistics
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                marginTop: 14,
                fontSize: 13.5,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Calendar size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Dates:</strong> December 3–4, 2026
                  <div style={{ color: 'var(--niral-muted)', fontSize: 12 }}>
                    30-hour offline hackathon
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Venue:</strong> Sri Shakthi Institute of Engineering and
                  Technology
                  <div style={{ color: 'var(--niral-muted)', fontSize: 12 }}>
                    L&T By-Pass, Chinniyampalayam, Coimbatore
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Layers size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Team Rules:</strong> 2 to 4 members
                  <div style={{ color: 'var(--niral-muted)', fontSize: 12 }}>
                    All members must hold verified applications
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Useful Portals */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Sparkles size={18} color="var(--niral-coral)" />
              Official Handbooks
            </h3>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}
            >
              <Link
                href="/rules"
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--niral-paper)',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                <span>Event Rules & Guidelines</span>
                <ExternalLink size={14} />
              </Link>

              <Link
                href="/tracks"
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--niral-paper)',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                <span>Themes & Problem Tracks</span>
                <ExternalLink size={14} />
              </Link>

              <Link
                href="/schedule"
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--niral-paper)',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                <span>30-Hour Event Schedule</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Desk Helpline */}
          <div
            className={styles.card}
            style={{
              background: '#fff',
              border: '2px solid #111',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--niral-muted)',
              }}
            >
              Organizing Secretariat
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              IoT Club — SIET
            </div>
            <div style={{ fontSize: 13, color: 'var(--niral-muted)', marginTop: 4 }}>
              Email:{' '}
              <a
                href="mailto:iotclub.siet@gmail.com"
                style={{ color: '#111', fontWeight: 600 }}
              >
                iotclub.siet@gmail.com
              </a>
            </div>
            <div style={{ fontSize: 13, color: 'var(--niral-muted)', marginTop: 2 }}>
              Helpline:{' '}
              <a href="tel:+918508511975" style={{ color: '#111', fontWeight: 600 }}>
                +91 8508511975
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
