import type { Metadata } from 'next';
import Link from 'next/link';
import {
  NiralAuthLayout,
  NiralAuthCard,
} from '@/components/niral-auth/niral-auth-system';
import { PopButton } from '@/components/niral/pop-button';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import styles from '@/components/niral-auth/niral-auth.module.css';

export const metadata: Metadata = {
  title: 'Access Restricted · NIRAL 2026',
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <NiralAuthLayout
      actionType="login"
      kicker="NIRAL 2026 · SECURITY BARRIER"
      headlineTitle="Access is"
      headlineHighlight="restricted."
      description="You do not have sufficient role privileges to view this portal or perform this administrative operation."
    >
      <NiralAuthCard
        eyebrow="403 FORBIDDEN"
        title="Access Restricted"
        subtitle="This resource is protected by NIRAL role-based access control."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: 20,
              background: '#FFF5F5',
              border: '2px solid #111',
              borderRadius: 14,
              boxShadow: '0 4px 0 #111',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={28} color="#9B2946" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ display: 'block', fontSize: 15, color: '#111', marginBottom: 4 }}>
                Insufficient Role Authorization
              </strong>
              <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>
                Public participant accounts cannot access Organizer Hub, Judging Rubrics, or Admin Console without verified authorization by the NIRAL organizing committee.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <PopButton href="/dashboard" className={styles.authSubmitButton}>
              Go to Participant Dashboard <ArrowRight size={16} />
            </PopButton>

            <PopButton cream href="/login">
              Sign In with a Different Account
            </PopButton>
          </div>

          <div className={styles.cardFooterLinks}>
            <span>Believe this is an error?</span>
            <Link href="/contact">Contact Event Support</Link>
          </div>
        </div>
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

