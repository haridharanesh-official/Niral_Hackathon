'use client';
import { useEffect, useRef, useState } from 'react';
import { AuthHeading, AuthLayout } from '@/components/niral-auth/auth-layout';
import { accountRequest } from '@/components/niral-auth/account-api';
import { PopButton } from '@/components/niral/pop-button';
import styles from '@/components/niral-auth/auth.module.css';
type Invitation = {
  id: string;
  expiresAt: string;
  team: { name: string; description?: string; theme?: string };
};
export function InvitationAcceptance({ authenticated }: { authenticated: boolean }) {
  const [items, setItems] = useState<Invitation[]>([]),
    [selected, setSelected] = useState(''),
    [loading, setLoading] = useState(authenticated),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [accepted, setAccepted] = useState(false),
    [declined, setDeclined] = useState(false);
  const [token, setToken] = useState('');
  const captured = useRef<string | null>(null);
  useEffect(() => {
    const value =
      captured.current ??
      new URLSearchParams(location.hash.slice(1)).get('token') ??
      new URLSearchParams(location.search).get('token') ??
      '';
    captured.current = value;
    queueMicrotask(() => setToken(value));
    if (value) history.replaceState(null, '', '/invite');
    if (!authenticated) return;
    let active = true;
    accountRequest<Invitation[]>('team-invitations')
      .then((data) => {
        if (active) {
          setItems(data);
          if (data.length === 1) setSelected(data[0].id);
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authenticated]);
  async function accept() {
    if (busy || !token || !selected || items.length !== 1) return;
    setBusy(true);
    setMessage('');
    try {
      await accountRequest('team-accept-invite', { token });
      setToken('');
      setAccepted(true);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'Invitation could not be accepted. Retry later.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout story="register">
      <AuthHeading
        eyebrow="Team invitation"
        title="A team wants you onboard."
        highlight=""
        subtitle="Review your invitation after signing in to your verified NIRAL account."
      />
      {!authenticated ? (
        <div className={styles.notice}>
          <p>
            Sign in before accepting an invitation. After signing in, reopen the original
            invitation email to load its secure link.
          </p>
          <PopButton href="/login?next=/invite">Sign in to review →</PopButton>
        </div>
      ) : loading ? (
        <p role="status">Loading your invitations…</p>
      ) : accepted ? (
        <div className={styles.success} role="status">
          <h2>Invitation accepted.</h2>
          <p>Your team membership was confirmed by the server.</p>
          <PopButton href="/dashboard/team">Open team dashboard →</PopButton>
        </div>
      ) : declined ? (
        <div className={styles.notice} role="status">
          <p>
            You chose not to join. The invitation stays pending until it expires;
            server-side decline is not available yet.
          </p>
          <PopButton href="/dashboard">Back to dashboard</PopButton>
        </div>
      ) : (
        <div className={styles.form}>
          {items.length ? (
            items.map((item) => (
              <label className={styles.notice} key={item.id}>
                <span className={styles.checkbox}>
                  <input
                    type="radio"
                    name="invitation"
                    checked={selected === item.id}
                    onChange={() => setSelected(item.id)}
                    disabled={busy}
                  />
                  <strong>{item.team.name}</strong>
                </span>
                <p>{item.team.description || 'No team description provided.'}</p>
                <p>{item.team.theme || 'Track not provided'}</p>
                <p>Expires {new Date(item.expiresAt).toLocaleString()}</p>
              </label>
            ))
          ) : (
            <p className={styles.notice}>
              No pending invitations. Your link may have expired, already been used, or
              belong to another account.
            </p>
          )}
          {items.length > 1 && (
            <p className={styles.notice}>
              You have multiple invitations. Acceptance is unavailable until the service
              can securely match this email link to a team preview. Contact the
              organizers.
            </p>
          )}
          {items.length > 0 && (
            <p className={styles.hint}>
              Use the original invitation email link. The server checks identity,
              invitation validity and team capacity before joining.
            </p>
          )}
          {message && (
            <p role="alert" className={styles.notice}>
              {message}
            </p>
          )}
          {!token && items.length > 0 && (
            <p className={styles.notice}>
              Reopen your invitation email to enable acceptance. Invitation tokens are
              never saved in browser storage.
            </p>
          )}
          <div className={styles.actions}>
            <PopButton
              disabled={busy || !selected || !token || items.length !== 1}
              onClick={accept}
            >
              {busy ? 'Accepting…' : 'Accept invitation'}
            </PopButton>
            <PopButton cream disabled={busy} onClick={() => setDeclined(true)}>
              Decline / Back
            </PopButton>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
