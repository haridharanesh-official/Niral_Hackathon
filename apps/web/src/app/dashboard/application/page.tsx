'use client';

import { PaymentSummary } from '@/components/payments/payment-summary';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileCheck2, Copy, Check, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/dashboard/participant-portal.module.css';



type ApplicationData = {
  institution?: string;
  department?: string;
  degree?: string;
  yearOfStudy?: string;
  phone?: string;
  interests?: string[];
  technologies?: string[];
  skills?: string;
  name?: string;
  email?: string;
};

type EnrollmentRecord = {
  id: string;
  registrationId: string;
  status: string;
  mode: string;
  createdAt: string;
  consentAcceptedAt?: string | null;
  consentVersion?: string | null;
  applicationData?: ApplicationData | null;
  emailDelivery?: string;
};

type EnrollmentResponse = {
  event: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    eventMode: string;
    settings?: { eligibilityText?: string; rulesText?: string; tracks?: string[] };
  } | null;
  enrollment: EnrollmentRecord | null;
  announcement?: { title: string; body: string; createdAt: string } | null;
};

export default function ApplicationDetailsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function loadData() {
    accountRequest<EnrollmentResponse>('application')
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load application record');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, [session?.user.id]);

  const enrollment = data?.enrollment;
  const appData = enrollment?.applicationData;
  const event = data?.event;

  function copyRegId() {
    if (enrollment?.registrationId) {
      void navigator.clipboard.writeText(enrollment.registrationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const statusMap: Record<string, { label: string; badgeClass: string; desc: string }> = {
    CONFIRMED: {
      label: 'Enrollment confirmed',
      badgeClass: styles.badgeSuccess,
      desc: 'Your event enrollment is confirmed. Prepare your team and project ideas for December 3–4.',
    },
    PENDING: {
      label: 'Pending confirmation',
      badgeClass: styles.badgeWarning,
      desc: 'Your event enrollment is pending confirmation. If payment is required, check its captured status below. A checkout callback alone does not confirm enrollment.',
    },
    WAITLISTED: {
      label: 'Waitlisted',
      badgeClass: styles.badgeNeutral,
      desc: 'Your application is currently on the waitlist. If spots open up before December 1, you will be notified immediately.',
    },
    REJECTED: {
      label: 'Not Selected',
      badgeClass: styles.badgeNeutral,
      desc: 'Thank you for your interest in NIRAL Hackathon 2026. Due to capacity limits, this application was not selected for this edition.',
    },
    WITHDRAWN: {
      label: 'Withdrawn',
      badgeClass: styles.badgeNeutral,
      desc: 'This application was marked as withdrawn.',
    },
  };

  const statusInfo = enrollment
    ? (statusMap[enrollment.status] ?? {
        label: enrollment.status,
        badgeClass: styles.badgeNeutral,
        desc: 'Application status is active.',
      })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Header */}
      <div className={styles.headingWrapper}>
        <PaymentSummary />
        <span className={styles.eyebrow}>Application Status &amp; Records</span>
        <h1 className={styles.portalTitle}>
          Application Details · <mark>Official Record</mark>
        </h1>
        <p className={styles.portalSubtitle}>
          Review your submitted application details, registration credentials, and current
          organizer decision.
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
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#666', fontSize: 16 }}>Loading your application record…</p>
        </div>
      ) : enrollment ? (
        <>
          {/* Registration ID & Decision Hero Banner */}
          <div
            className={styles.card}
            style={{
              background: enrollment.status === 'CONFIRMED' ? '#faf7f2' : '#fff',
              borderWidth: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                borderBottom: '2px solid #111',
                paddingBottom: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 13,
                    color: '#666',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Official Registration ID
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <strong
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: 26,
                      letterSpacing: '0.5px',
                    }}
                  >
                    {enrollment.registrationId}
                  </strong>
                  <button
                    type="button"
                    onClick={copyRegId}
                    style={{
                      border: '1.5px solid #111',
                      background: copied ? '#c3e6cb' : '#faf7f2',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 0 #111',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy ID'}
                  </button>
                </div>
              </div>

              {statusInfo && (
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: 13,
                      color: '#666',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Approval Status
                  </span>
                  <span
                    className={`${styles.badge} ${statusInfo.badgeClass}`}
                    style={{ fontSize: 14, padding: '6px 16px' }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#333', margin: 0 }}>
              {statusInfo?.desc}
            </p>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}
          >
            {/* Academic & Participant Information */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <FileCheck2 size={20} style={{ color: '#fd9b9b' }} />
                  Participant Information
                </h2>
              </div>

              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  gap: '12px 14px',
                  fontSize: 14,
                  margin: 0,
                }}
              >
                <dt style={{ fontWeight: 700, color: '#666' }}>Full Name</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {appData?.name || session?.user?.name || 'Account Participant'}
                </dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Email Address</dt>
                <dd style={{ margin: 0 }}>{appData?.email || session?.user?.email}</dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Institution / College</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  {appData?.institution || 'Not specified'}
                </dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Department</dt>
                <dd style={{ margin: 0 }}>{appData?.department || 'Not specified'}</dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Degree &amp; Year</dt>
                <dd style={{ margin: 0 }}>
                  {appData?.degree
                    ? `${appData.degree} · ${appData.yearOfStudy || ''}`
                    : 'Not specified'}
                </dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Contact Phone</dt>
                <dd style={{ margin: 0 }}>{appData?.phone || 'Not specified'}</dd>

                <dt style={{ fontWeight: 700, color: '#666' }}>Mode</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>
                  Onsite (Sri Shakthi Institute of Engineering and Technology)
                </dd>
              </dl>
            </div>

            {/* Technical Skills & Track Alignment */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Sparkles size={20} style={{ color: '#fd9b9b' }} />
                  Skills &amp; Track Alignment
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <strong
                    style={{
                      fontSize: 13,
                      color: '#666',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Listed Technologies &amp; Tools
                  </strong>
                  {appData?.technologies && appData.technologies.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {appData.technologies.map((tech) => (
                        <span
                          key={tech}
                          style={{
                            padding: '4px 10px',
                            background: '#faf7f2',
                            border: '1.5px solid #111',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      No technology tags provided.
                    </p>
                  )}
                </div>

                <div>
                  <strong
                    style={{
                      fontSize: 13,
                      color: '#666',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Track Interests
                  </strong>
                  {appData?.interests && appData.interests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {appData.interests.map((interest) => (
                        <span
                          key={interest}
                          style={{
                            padding: '4px 10px',
                            background: '#ffe2db',
                            border: '1.5px solid #111',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      General Emerging Technologies track.
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1.5px solid #eee', paddingTop: 14 }}>
                  <strong
                    style={{
                      fontSize: 13,
                      color: '#666',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Application History
                  </strong>
                  <p style={{ fontSize: 13, color: '#444', margin: 0 }}>
                    Submitted on{' '}
                    {new Intl.DateTimeFormat('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: event?.timezone || 'Asia/Kolkata',
                    }).format(new Date(enrollment.createdAt))}
                  </p>
                  <p style={{ fontSize: 12, color: '#777', margin: '4px 0 0' }}>
                    Declaration &amp; rules verified:{' '}
                    {enrollment.consentAcceptedAt ? 'Accepted' : 'Recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Navigation Strip */}
          <div
            className={styles.card}
            style={{
              background: '#faf7f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ fontSize: 15, display: 'block' }}>
                Next Milestone: Squad Formation
              </strong>
              <span style={{ fontSize: 13, color: '#666' }}>
                NIRAL rules require 2 to 4 members per team. Form your squad or accept an
                invite.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={loadData}
                style={{
                  border: '1.5px solid #111',
                  background: '#fff',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 3px 0 #111',
                }}
              >
                <RefreshCw size={14} />
                Refresh Status
              </button>
              <PopButton href="/dashboard/team">Manage Squad →</PopButton>
            </div>
          </div>
        </>
      ) : (
        <div
          className={styles.card}
          style={{ textAlign: 'center', padding: '48px 24px' }}
        >
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, marginBottom: 8 }}>
            No Submitted Application Found
          </h2>
          <p
            style={{ fontSize: 14, color: '#666', maxWidth: 540, margin: '0 auto 24px' }}
          >
            You have not yet submitted your official NIRAL Hackathon 2026 application.
            Complete the registration form to obtain your verified registration ID.
          </p>
          <PopButton href="/apply">Apply to NIRAL 2026 →</PopButton>
        </div>
      )}
    </div>
  );
}
