'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Users2,
  UserPlus,
  Share2,
  Copy,
  Check,
  LogOut,
  Trash2,
  UserX,
  Mail,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Compass,
  Search,
  ExternalLink,
} from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/dashboard/participant-portal.module.css';

const NIRAL_THEMES = [
  'AI & Smart Automation',
  'Healthcare & MedTech',
  'Smart Agriculture & Food Security',
  'Cyber Physical Systems & IoT',
  'Open Innovation & Emerging Tech',
];

type TeamMember = {
  role: string;
  joinedAt?: string;
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
    college?: string | null;
    department?: string | null;
    xp?: number;
  };
};

type TeamInvitation = {
  id: string;
  invitedEmail: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type TeamJoinRequest = {
  id: string;
  message?: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
};

type TeamData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  theme?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  recruitmentStatus: 'OPEN' | 'CLOSED';
  inviteCode: string;
  maxMembers: number;
  leaderId?: string | null;
  members: TeamMember[];
  invitations?: TeamInvitation[];
  joinRequests?: TeamJoinRequest[];
  submission?: { status: string; title: string } | null;
};

type DiscoverTeam = {
  id: string;
  name: string;
  description?: string | null;
  theme?: string | null;
  visibility: string;
  recruitmentStatus: string;
  members: Array<{ role: string; user: { name: string; college?: string | null } }>;
  matchReasons?: string[];
};

export default function TeamDashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [team, setTeam] = useState<TeamData | null>(null);
  const [discover, setDiscover] = useState<DiscoverTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'create' | 'join' | 'discover'>('create');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState(NIRAL_THEMES[0]);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [recruitmentStatus, setRecruitmentStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Leave / Remove confirmation modals
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      setInviteCode(invite);
      setTab('join');
    }
  }, [searchParams]);

  const userId = session?.user?.id;
  const isLeader = useMemo(() => {
    if (!team || !userId) return false;
    return team.leaderId === userId || team.members.some((m) => m.role === 'LEADER' && m.user.id === userId);
  }, [team, userId]);

  async function loadTeamData() {
    setLoading(true);
    try {
      const [myTeamRes, discoverRes] = await Promise.all([
        accountRequest<TeamData | null>('team').catch(() => null),
        accountRequest<DiscoverTeam[]>('team-discover').catch(() => []),
      ]);
      setTeam(myTeamRes && myTeamRes.id ? myTeamRes : null);
      setDiscover(Array.isArray(discoverRes) ? discoverRes : []);
      setFeedback(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to load team data' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeamData();
  }, []);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 50) {
      setFeedback({
        type: 'error',
        message: 'Team pitch/description must be at least 50 characters to explain your project direction.',
      });
      return;
    }

    setBusyAction(true);
    setFeedback(null);
    try {
      const created = await accountRequest<TeamData>('team-create', {
        name: teamName,
        description,
        theme,
        visibility,
        recruitmentStatus,
      });
      setTeam(created);
      setFeedback({ type: 'success', message: `Team "${created.name}" created successfully!` });
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to create team.' });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setBusyAction(true);
    setFeedback(null);
    try {
      const joined = await accountRequest<TeamData>('team-join', {
        inviteCode: inviteCode.trim(),
      });
      setTeam(joined);
      setFeedback({ type: 'success', message: `Welcome to ${joined.name}!` });
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to join team.' });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !team) return;

    setBusyAction(true);
    setFeedback(null);
    try {
      await accountRequest('team-invite', {
        teamId: team.id,
        email: inviteEmail.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Invitation sent to ${inviteEmail}. In development, inspect MailHog at localhost:8025.`,
      });
      setInviteEmail('');
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to send invitation.' });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCancelInvite(invitationId: string) {
    setBusyAction(true);
    try {
      await accountRequest('team-cancel-invite', { invitationId });
      setFeedback({ type: 'success', message: 'Invitation cancelled.' });
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to cancel invitation.' });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    setBusyAction(true);
    setConfirmRemoveMember(null);
    try {
      await accountRequest('team-remove-member', { memberId: memberUserId });
      setFeedback({ type: 'success', message: 'Member removed from team.' });
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to remove member.' });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleLeaveTeam() {
    setBusyAction(true);
    setConfirmLeave(false);
    try {
      const res: any = await accountRequest('team-leave', {});
      setFeedback({ type: 'success', message: res.message ?? 'Successfully left the team.' });
      setTeam(null);
      await loadTeamData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message ?? 'Failed to leave team.' });
    } finally {
      setBusyAction(false);
    }
  }

  function copyCode() {
    if (!team) return;
    void navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyInviteLink() {
    if (!team) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://niralhackathon.dpdns.org';
    const link = `${origin}/dashboard/team?invite=${team.inviteCode}`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div className={styles.headingWrapper}>
        <span className={styles.eyebrow}>Team Workspace</span>
        <h1 className={styles.portalTitle}>
          Squad Management · <mark>Form &amp; Collaborate</mark>
        </h1>
        <p className={styles.portalSubtitle}>
          NIRAL Hackathon 2026 rules require teams of 2 to 4 members. Every participant can only belong to one team.
        </p>
      </div>

      {feedback && (
        <div
          className={styles.card}
          style={{
            background: feedback.type === 'success' ? '#faf7f2' : '#fff0e9',
            borderColor: feedback.type === 'success' ? '#28a745' : '#fd9b9b',
            color: feedback.type === 'success' ? '#155724' : '#900',
            padding: '14px 18px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <strong>{feedback.message}</strong>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#666', fontSize: 16 }}>Loading team workspace…</p>
        </div>
      ) : team ? (
        /* ================= USER HAS A TEAM ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Team Hero Card */}
          <div className={styles.card}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                borderBottom: '2px solid #111',
                paddingBottom: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 26, margin: 0 }}>{team.name}</h2>
                  <span className={`${styles.badge} ${styles.badgeCoral}`}>
                    {team.members.length} / {team.maxMembers} Members
                  </span>
                  {isLeader && (
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                      You are Leader
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#555' }}>
                  Track: <strong>{team.theme || 'General Emerging Technologies'}</strong> · Visibility: {team.visibility} · Status: {team.recruitmentStatus}
                </span>
              </div>

              {/* Shareable Invite Code & Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={copyCode}
                  style={{
                    border: '1.5px solid #111',
                    background: copiedCode ? '#c3e6cb' : '#faf7f2',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 0 #111',
                  }}
                  title="Copy team code"
                >
                  {copiedCode ? <Check size={15} /> : <Copy size={15} />}
                  <span>Code: <code>{team.inviteCode}</code></span>
                </button>

                <button
                  type="button"
                  onClick={copyInviteLink}
                  style={{
                    border: '1.5px solid #111',
                    background: copiedLink ? '#c3e6cb' : '#fff',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 0 #111',
                  }}
                  title="Copy shareable invitation link"
                >
                  {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>
            </div>

            {team.description && (
              <p style={{ fontSize: 14.5, color: '#333', lineHeight: 1.6, margin: '0 0 16px' }}>
                {team.description}
              </p>
            )}

            {/* Authoritative team size warning if < 2 */}
            {team.members.length < 2 && (
              <div
                style={{
                  background: '#ffe2db',
                  border: '1.5px solid #111',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#900',
                }}
              >
                <AlertCircle size={16} />
                <span>
                  NIRAL Hackathon 2026 requires a minimum of <strong>2 members</strong> per squad to qualify for judging. Recruit at least 1 teammate.
                </span>
              </div>
            )}
          </div>

          {/* Members Roster & Leader Management */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}
          >
            {/* Squad Members Roster */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Users2 size={20} style={{ color: '#fd9b9b' }} />
                  Squad Members ({team.members.length} / {team.maxMembers})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {team.members.map((member) => {
                  const isThisLeader = member.role === 'LEADER';
                  const isCurrent = member.user.id === userId;
                  return (
                    <div
                      key={member.user.id}
                      style={{
                        border: '2px solid #111',
                        borderRadius: 10,
                        padding: '12px 16px',
                        background: isThisLeader ? '#faf7f2' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: isThisLeader ? '#fd9b9b' : '#faf7f2',
                            border: '1.5px solid #111',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {member.user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 14.5 }}>{member.user.name}</strong>
                            {isCurrent && <span style={{ fontSize: 11, color: '#777' }}>(You)</span>}
                          </div>
                          <span style={{ fontSize: 12, color: '#666', display: 'block' }}>
                            {member.user.college || 'Institution registered'} · {member.user.department || 'Participant'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className={`${styles.badge} ${
                            isThisLeader ? styles.badgeCoral : styles.badgeNeutral
                          }`}
                        >
                          {member.role}
                        </span>

                        {/* Leader can remove other members */}
                        {isLeader && !isThisLeader && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveMember(member.user.id)}
                            style={{
                              border: '1.5px solid #900',
                              background: '#fff0e9',
                              color: '#900',
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Remove member from squad"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leave Team Button */}
              <div style={{ marginTop: 24, borderTop: '1.5px solid #eee', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setConfirmLeave(true)}
                  style={{
                    border: '1.5px solid #900',
                    background: '#fff',
                    color: '#900',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 0 #900',
                  }}
                >
                  <LogOut size={15} />
                  <span>Leave Squad</span>
                </button>
              </div>
            </div>

            {/* Leader Workspace / Invitation Tools */}
            {isLeader ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Invite Teammate by Email */}
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      <UserPlus size={20} style={{ color: '#fd9b9b' }} />
                      Invite Teammate via Email
                    </h3>
                  </div>

                  <p style={{ fontSize: 13, color: '#555', margin: '0 0 14px' }}>
                    Send an invitation token directly to a registered participant&apos;s email address.
                  </p>

                  <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@example.com"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '2px solid #111',
                        borderRadius: 8,
                        fontSize: 13.5,
                      }}
                      disabled={team.members.length >= team.maxMembers || busyAction}
                    />
                    <PopButton
                      type="submit"
                      disabled={team.members.length >= team.maxMembers || busyAction}
                      style={{ padding: '10px 18px', fontSize: 13 }}
                    >
                      Send Invite
                    </PopButton>
                  </form>
                  {team.members.length >= team.maxMembers && (
                    <small style={{ color: '#900', display: 'block', marginTop: 6, fontSize: 12 }}>
                      Your team has reached the maximum capacity of 4 members.
                    </small>
                  )}
                </div>

                {/* Pending Invitations */}
                <div className={`${styles.card} ${styles.cardPaper}`}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      <Clock size={18} style={{ color: '#fd9b9b' }} />
                      Pending Invitations
                    </h3>
                  </div>

                  {team.invitations && team.invitations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {team.invitations.map((inv) => (
                        <div
                          key={inv.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            border: '1.5px solid #111',
                            borderRadius: 8,
                            background: '#fff',
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <strong>{inv.invitedEmail}</strong>
                            <small style={{ display: 'block', color: '#777', fontSize: 11 }}>
                              Expires:{' '}
                              {new Date(inv.expiresAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelInvite(inv.id)}
                            style={{
                              border: '1px solid #900',
                              background: '#fff0e9',
                              color: '#900',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                      No active pending invitations. Share your invite code or invite teammates above.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Non-leader member information */
              <div className={`${styles.card} ${styles.cardPaper}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <Sparkles size={20} style={{ color: '#fd9b9b' }} />
                    Squad Collaboration
                  </h3>
                </div>
                <p style={{ fontSize: 13.5, color: '#444', lineHeight: 1.6 }}>
                  You are a confirmed team member in <strong>{team.name}</strong>. Share your squad&apos;s invite code{' '}
                  <code>{team.inviteCode}</code> with other members you wish to recruit.
                </p>
                <div style={{ marginTop: 14 }}>
                  <PopButton cream onClick={copyInviteLink}>
                    <Share2 size={14} />
                    Copy Invite Link
                  </PopButton>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Leave Modal */}
          {confirmLeave && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'grid',
                placeItems: 'center',
                zIndex: 200,
                padding: 16,
              }}
              onClick={() => setConfirmLeave(false)}
            >
              <div
                className={styles.card}
                style={{ maxWidth: 480, width: '100%', padding: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 22, margin: '0 0 12px' }}>
                  Leave Squad &quot;{team.name}&quot;?
                </h3>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {isLeader && team.members.length > 1
                    ? 'As the team leader, leaving will automatically transfer squad leadership to the next member.'
                    : isLeader && team.members.length === 1
                      ? 'You are the only member in this team. Leaving will permanently disband the team.'
                      : 'Are you sure you want to leave this team? You will need to join or form another squad.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(false)}
                    style={{
                      border: '1.5px solid #111',
                      background: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveTeam}
                    disabled={busyAction}
                    style={{
                      border: '2px solid #900',
                      background: '#900',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 3px 0 #111',
                    }}
                  >
                    {busyAction ? 'Leaving…' : 'Confirm Leave'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Remove Member Modal */}
          {confirmRemoveMember && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'grid',
                placeItems: 'center',
                zIndex: 200,
                padding: 16,
              }}
              onClick={() => setConfirmRemoveMember(null)}
            >
              <div
                className={styles.card}
                style={{ maxWidth: 440, width: '100%', padding: 24 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 20, margin: '0 0 12px' }}>
                  Remove Member from Squad?
                </h3>
                <p style={{ fontSize: 13.5, color: '#444', lineHeight: 1.5, margin: '0 0 20px' }}>
                  This member will be removed from your team roster and will need an invite code to rejoin.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveMember(null)}
                    style={{
                      border: '1.5px solid #111',
                      background: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(confirmRemoveMember)}
                    disabled={busyAction}
                    style={{
                      border: '2px solid #900',
                      background: '#900',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {busyAction ? 'Removing…' : 'Remove Member'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= USER HAS NO TEAM ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tabs Control */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTab('create')}
              style={{
                padding: '10px 18px',
                border: '2px solid #111',
                borderRadius: 10,
                background: tab === 'create' ? '#fd9b9b' : '#fff',
                fontWeight: tab === 'create' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: tab === 'create' ? '0 3px 0 #111' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <UserPlus size={16} />
              <span>Create a Squad</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('join')}
              style={{
                padding: '10px 18px',
                border: '2px solid #111',
                borderRadius: 10,
                background: tab === 'join' ? '#fd9b9b' : '#fff',
                fontWeight: tab === 'join' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: tab === 'join' ? '0 3px 0 #111' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Users2 size={16} />
              <span>Join via Invite Code</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('discover')}
              style={{
                padding: '10px 18px',
                border: '2px solid #111',
                borderRadius: 10,
                background: tab === 'discover' ? '#fd9b9b' : '#fff',
                fontWeight: tab === 'discover' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: tab === 'discover' ? '0 3px 0 #111' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Compass size={16} />
              <span>Discover Open Teams ({discover.length})</span>
            </button>
          </div>

          {/* TAB 1: CREATE SQUAD */}
          {tab === 'create' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <UserPlus size={20} style={{ color: '#fd9b9b' }} />
                  Register a New NIRAL Squad
                </h2>
              </div>

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. EdgeInovators, AgriBotics, NeuroFlow"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #111',
                      borderRadius: 10,
                      fontSize: 14,
                      background: '#fff',
                      boxShadow: '0 3px 0 #111',
                    }}
                  />
                  <small style={{ color: '#666', fontSize: 11, display: 'block', marginTop: 4 }}>
                    Must be unique within the NIRAL 2026 hackathon.
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Problem Track Alignment *
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #111',
                      borderRadius: 10,
                      fontSize: 14,
                      background: '#fff',
                      boxShadow: '0 3px 0 #111',
                    }}
                  >
                    {NIRAL_THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Team Pitch &amp; Project Vision * (Minimum 50 characters)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your innovation concept, the core problem your squad aims to solve, and the technologies you plan to integrate..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid #111',
                      borderRadius: 10,
                      fontSize: 14,
                      background: '#fff',
                      boxShadow: '0 3px 0 #111',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginTop: 4 }}>
                    <span style={{ color: description.length < 50 ? '#900' : '#28a745', fontWeight: 600 }}>
                      {description.length} / 50 characters minimum
                    </span>
                    <span style={{ color: '#666' }}>Helps organizers and prospective members understand your idea.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '2px solid #111',
                        borderRadius: 10,
                        fontSize: 13.5,
                        background: '#fff',
                        boxShadow: '0 3px 0 #111',
                      }}
                    >
                      <option value="PUBLIC">Public (Listed in team discovery)</option>
                      <option value="PRIVATE">Private (Invite code only)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Recruitment Status
                    </label>
                    <select
                      value={recruitmentStatus}
                      onChange={(e) => setRecruitmentStatus(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '2px solid #111',
                        borderRadius: 10,
                        fontSize: 13.5,
                        background: '#fff',
                        boxShadow: '0 3px 0 #111',
                      }}
                    >
                      <option value="OPEN">Open (Accepting teammates up to 4)</option>
                      <option value="CLOSED">Closed (Roster full / invite only)</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #111', paddingTop: 18, marginTop: 8 }}>
                  <PopButton type="submit" disabled={busyAction || description.length < 50}>
                    {busyAction ? 'Creating Squad…' : 'Create Team & Generate Invite Code →'}
                  </PopButton>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: JOIN VIA CODE */}
          {tab === 'join' && (
            <div className={styles.card} style={{ maxWidth: 640 }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Users2 size={20} style={{ color: '#fd9b9b' }} />
                  Join Squad via Invite Code
                </h2>
              </div>

              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 16px' }}>
                Ask your team leader for their unique 6–10 character team invite code, or click the direct invite link they shared with you.
              </p>

              <form onSubmit={handleJoinTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Team Invite Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Paste invite code..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #111',
                      borderRadius: 10,
                      fontSize: 16,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      background: '#fff',
                      boxShadow: '0 3px 0 #111',
                    }}
                  />
                </div>

                <div>
                  <PopButton type="submit" disabled={busyAction || !inviteCode.trim()}>
                    {busyAction ? 'Joining Squad…' : 'Join Team Now →'}
                  </PopButton>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DISCOVER OPEN TEAMS */}
          {tab === 'discover' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Compass size={20} style={{ color: '#fd9b9b' }} />
                  Discover Open NIRAL Teams
                </h2>
              </div>

              {discover.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 16,
                  }}
                >
                  {discover.map((disc) => (
                    <div
                      key={disc.id}
                      style={{
                        border: '2px solid #111',
                        borderRadius: 12,
                        padding: 16,
                        background: '#fff',
                        boxShadow: '0 3px 0 #111',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong style={{ fontSize: 16 }}>{disc.name}</strong>
                          <span className={`${styles.badge} ${styles.badgeCoral}`} style={{ fontSize: 11 }}>
                            {disc.members.length} / 4 Members
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#777', display: 'block', marginBottom: 8 }}>
                          Track: {disc.theme || 'General'}
                        </span>
                        {disc.description && (
                          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, margin: '0 0 12px' }}>
                            {disc.description.length > 120
                              ? `${disc.description.slice(0, 120)}…`
                              : disc.description}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid #eee', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          Lead by: {disc.members[0]?.user?.name ?? 'Lead Hacker'}
                        </span>
                        <PopButton
                          cream
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => {
                            setTab('join');
                            setFeedback({
                              type: 'success',
                              message: `To join "${disc.name}", contact the leader or request their invite code.`,
                            });
                          }}
                        >
                          Request Code
                        </PopButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                    No public squads are currently recruiting open members. Be the first to start a squad!
                  </p>
                  <PopButton onClick={() => setTab('create')}>Create New Squad →</PopButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
