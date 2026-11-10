import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NiralAuthLayout,
  NiralAuthCard,
} from '@/components/niral-auth/niral-auth-system';
import { PopButton } from '@/components/niral/pop-button';
import { Clock, ArrowRight } from 'lucide-react';
import styles from '@/components/niral-auth/niral-auth.module.css';

export const metadata: Metadata = {
  title: 'Session Expired · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · SECURITY"
      headlineTitle="Your session has"
      headlineHighlight="ended."
      description="For your security, authenticated sessions automatically expire after periods of inactivity."
    >
      <NiralAuthCard
        eyebrow="SESSION TIMEOUT"
        title="Session Expired"
        subtitle="Please sign in again to continue working in your participant dashboard."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              padding: 18,
              background: '#FAF7F2',
              border: '2px solid #111',
              borderRadius: 14,
              boxShadow: '0 4px 0 #111',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: '1.5px solid #111',
                background: '#FFE2DB',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={20} color="#111" />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              Your in-progress submissions and team status have been safely preserved. Re-authenticate to resume where you left off.
            </p>
          </div>

          <PopButton href="/login" className={styles.authSubmitButton}>
            Sign In Again <ArrowRight size={16} />
          </PopButton>

          <div className={styles.cardFooterLinks}>
            <Link href="/forgot-password">Trouble signing in? Password recovery</Link>
            <span>·</span>
            <Link href="/">Return to NIRAL homepage</Link>
          </div>
        </div>
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}
