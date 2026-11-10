'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  GraduationCap,
  Sparkles,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  X,
  Shield,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { PopButton } from '@/components/niral/pop-button';
import { accountRequest } from '@/components/niral-auth/account-api';
import styles from '@/components/dashboard/participant-portal.module.css';

const SUGGESTED_SKILLS = [
  'Python',
  'TypeScript',
  'React / Next.js',
  'Node.js / NestJS',
  'Embedded C / C++',
  'IoT Protocols (MQTT/CoAP)',
  'TensorFlow / PyTorch',
  'Computer Vision',
  'Edge AI',
  'PostgreSQL / Prisma',
  'Docker',
  'Robotics / ROS',
  'Arduino / ESP32',
  'Cybersecurity',
];

const NIRAL_TRACKS = [
  'AI & Smart Automation',
  'Healthcare & MedTech',
  'Smart Agriculture & Food Security',
  'Cyber Physical Systems & IoT',
  'Open Innovation & Emerging Tech',
];

export default function ParticipantProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [degree, setDegree] = useState('B.E / B.Tech');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [notifyAnnounce, setNotifyAnnounce] = useState(true);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });

    accountRequest<{
      name: string;
      email: string;
      bio?: string;
      image?: string;
      college?: string;
      department?: string;
      profile?: {
        degree?: string;
        yearOfStudy?: string;
        phoneNumber?: string;
        skillsList?: string[];
        skills?: Record<string, string>;
        interests?: string[];
      };
      notificationPrefs?: { teamAlerts?: boolean; announcementAlerts?: boolean };
    }>('profile')
      .then((user) => {
        if (!active) return;
        setName(user.name ?? '');
        setEmail(user.email ?? '');
        setBio(user.bio ?? '');
        setImage(user.image ?? '');
        setCollege(user.college ?? '');
        setDepartment(user.department ?? '');

        const prof = user.profile ?? {};
        if (prof.degree) setDegree(prof.degree);
        if (prof.yearOfStudy) setYearOfStudy(prof.yearOfStudy);
        if (prof.phoneNumber) setPhone(prof.phoneNumber);
        if (Array.isArray(prof.skillsList)) {
          setSkills(prof.skillsList);
        } else if (prof.skills && typeof prof.skills === 'object') {
          setSkills(Object.keys(prof.skills));
        }
        if (Array.isArray(prof.interests)) {
          setSelectedTracks(prof.interests);
        }

        const prefs = user.notificationPrefs ?? {};
        if (typeof prefs.teamAlerts === 'boolean') setNotifyTeam(prefs.teamAlerts);
        if (typeof prefs.announcementAlerts === 'boolean')
          setNotifyAnnounce(prefs.announcementAlerts);
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to load profile',
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function addSkill(skillName: string) {
    const trimmed = skillName.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  }

  function removeSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  function toggleTrack(track: string) {
    if (selectedTracks.includes(track)) {
      setSelectedTracks(selectedTracks.filter((t) => t !== track));
    } else {
      setSelectedTracks([...selectedTracks, track]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const skillsRecord: Record<string, string> = {};
    for (const s of skills) {
      skillsRecord[s.toLowerCase().replace(/[^a-z0-9]/g, '_')] = 'proficient';
    }

    const payload = {
      name,
      bio,
      image: image || undefined,
      college,
      department,
      profile: {
        degree,
        yearOfStudy,
        phoneNumber: phone,
        skillsList: skills,
        skills: skillsRecord,
        interests: selectedTracks,
      },
      notificationPrefs: {
        teamAlerts: notifyTeam,
        announcementAlerts: notifyAnnounce,
      },
      markComplete: Boolean(name && college && department),
    };

    try {
      await accountRequest('profile', payload, 'PATCH');
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      void updateSession();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not update profile. Please check your inputs.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Header */}
      <div className={styles.headingWrapper}>
        <span className={styles.eyebrow}>Participant Credentials</span>
        <h1 className={styles.portalTitle}>
          Participant Profile · <mark>Account &amp; Skills</mark>
        </h1>
        <p className={styles.portalSubtitle}>
          Manage your personal details, academic background, technical skills, and
          notification preferences.
        </p>
      </div>

      {feedback && (
        <div
          className={styles.card}
          style={{
            background: feedback.type === 'success' ? '#faf7f2' : '#fff0e9',
            borderColor: feedback.type === 'success' ? '#28a745' : '#fd9b9b',
            color: feedback.type === 'success' ? '#155724' : '#900',
            padding: '16px 20px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <strong>{feedback.message}</strong>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#666', fontSize: 16 }}>Loading profile credentials…</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Section 1: Personal Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <User size={20} style={{ color: '#fd9b9b' }} />
                Personal Information
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 18,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #111',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#fff',
                    boxShadow: '0 3px 0 #111',
                  }}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #999',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#faf7f2',
                    color: '#666',
                    cursor: 'not-allowed',
                  }}
                />
                <small
                  style={{ fontSize: 11, color: '#666', marginTop: 4, display: 'block' }}
                >
                  Email is locked to your verified account credentials.
                </small>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #111',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#fff',
                    boxShadow: '0 3px 0 #111',
                  }}
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #111',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#fff',
                    boxShadow: '0 3px 0 #111',
                  }}
                  placeholder="https://..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Bio / Hacker Headline
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
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
                  placeholder="Passionate full-stack hacker building autonomous robotics and AI solutions..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <GraduationCap size={20} style={{ color: '#fd9b9b' }} />
                Academic Background
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 18,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Institution / College Name *
                </label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #111',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#fff',
                    boxShadow: '0 3px 0 #111',
                  }}
                  placeholder="e.g. Sri Shakthi Institute of Engineering and Technology"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Department / Major *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #111',
                    borderRadius: 10,
                    fontSize: 14,
                    background: '#fff',
                    boxShadow: '0 3px 0 #111',
                  }}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Degree Program
                </label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
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
                  <option value="B.E / B.Tech">B.E / B.Tech</option>
                  <option value="M.E / M.Tech">M.E / M.Tech</option>
                  <option value="B.Sc / M.Sc">B.Sc / M.Sc</option>
                  <option value="BCA / MCA">BCA / MCA</option>
                  <option value="Ph.D / Research">Ph.D / Research</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
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
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Skills & Track Interests */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <Sparkles size={20} style={{ color: '#fd9b9b' }} />
                Skills &amp; Challenge Track Alignment
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Skills Tags */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Your Technical Skills &amp; Proficiencies
                </label>

                {skills.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: '#faf7f2',
                          border: '1.5px solid #111',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            padding: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                    No skills added yet. Add your technologies below to help teammates
                    find you.
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10, maxWidth: 440 }}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(newSkill);
                      }
                    }}
                    placeholder="Add custom skill (e.g. Next.js, PyTorch)..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '2px solid #111',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(newSkill)}
                    style={{
                      border: '2px solid #111',
                      background: '#fd9b9b',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 0 #111',
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Suggested skill chips */}
                <div style={{ marginTop: 12 }}>
                  <small
                    style={{
                      fontSize: 12,
                      color: '#777',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Quick suggestions:
                  </small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SUGGESTED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 8)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSkill(s)}
                          style={{
                            border: '1px dashed #666',
                            background: '#fff',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11.5,
                            cursor: 'pointer',
                          }}
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Challenge Track Interests */}
              <div style={{ borderTop: '1.5px solid #eee', paddingTop: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Preferred NIRAL Problem Tracks
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 10,
                  }}
                >
                  {NIRAL_TRACKS.map((track) => {
                    const isSelected = selectedTracks.includes(track);
                    return (
                      <button
                        key={track}
                        type="button"
                        onClick={() => toggleTrack(track)}
                        style={{
                          border: '2px solid #111',
                          borderRadius: 10,
                          padding: '10px 14px',
                          background: isSelected ? '#ffe2db' : '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: 13,
                          boxShadow: isSelected ? '0 2px 0 #111' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{track}</span>
                        {isSelected && (
                          <CheckCircle2 size={16} style={{ color: '#b76262' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Account Preferences & Security */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {/* Preferences Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Bell size={20} style={{ color: '#fd9b9b' }} />
                  Notification Preferences
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 13.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifyTeam}
                    onChange={(e) => setNotifyTeam(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#fd9b9b' }}
                  />
                  <span>Email alerts for team invitations &amp; join requests</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 13.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifyAnnounce}
                    onChange={(e) => setNotifyAnnounce(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#fd9b9b' }}
                  />
                  <span>
                    Email alerts for official event bulletins &amp; schedule updates
                  </span>
                </label>
              </div>
            </div>

            {/* Password Management Card */}
            <div className={`${styles.card} ${styles.cardPaper}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <KeyRound size={20} style={{ color: '#fd9b9b' }} />
                  Security &amp; Password Management
                </h2>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: '#555',
                  lineHeight: 1.5,
                  margin: '0 0 16px',
                }}
              >
                Password updates use secure single-use email verification tokens hashed
                with SHA-256 at rest.
              </p>
              <Link
                href="/forgot-password"
                style={{
                  border: '2px solid #111',
                  background: '#fff',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 3px 0 #111',
                  color: '#111',
                  textDecoration: 'none',
                }}
              >
                <span>Change Password Securely</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Save Button Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 14,
              borderTop: '2px solid #111',
              paddingTop: 20,
            }}
          >
            <PopButton type="submit" disabled={saving}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} />
                {saving ? 'Saving Changes…' : 'Save Profile Changes →'}
              </span>
            </PopButton>
          </div>
        </form>
      )}
    </div>
  );
}
