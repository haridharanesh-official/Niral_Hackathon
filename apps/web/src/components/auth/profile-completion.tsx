'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthHeading, AuthLayout } from '@/components/niral-auth/auth-layout';
import { TactileField } from '@/components/niral-auth/form-controls';
import { accountRequest } from '@/components/niral-auth/account-api';
import { PopButton } from '@/components/niral/pop-button';
import styles from '@/components/niral-auth/auth.module.css';
type Profile = {
  name?: string;
  email?: string;
  bio?: string;
  image?: string;
  profile?: Record<string, unknown>;
};
export function ProfileCompletion() {
  const [values, setValues] = useState({
    name: '',
    bio: '',
    image: '',
    github: '',
    linkedin: '',
    portfolio: '',
  });
  const [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [preview, setPreview] = useState('');
  const router = useRouter();
  useEffect(() => {
    let active = true;
    accountRequest<Profile>('profile')
      .then((user) => {
        if (!active) return;
        const p = user.profile ?? {};
        let draft: Record<string, unknown> = {};
        try {
          draft = JSON.parse(sessionStorage.getItem('niral.registration.v3') ?? '{}');
        } catch {
          /* Draft optional. */
        }
        if (!user.email || draft.email !== user.email) draft = {};
        setValues({
          name:
            typeof draft.displayName === 'string' && draft.displayName
              ? draft.displayName
              : (user.name ?? ''),
          bio: user.bio ?? '',
          image: user.image ?? '',
          github: String(p.github ?? draft.github ?? ''),
          linkedin: String(p.linkedin ?? ''),
          portfolio: String(p.portfolio ?? ''),
        });
        setLoaded(true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const filled = Object.values(values).filter((v) => v.trim()).length;
  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || !loaded) return;
    if (
      ['github', 'linkedin', 'portfolio', 'image'].some((key) => {
        const v = values[key as keyof typeof values];
        return v && (!/^https?:\/\//i.test(v) || !URL.canParse(v));
      })
    ) {
      setError('Use complete http or https URLs for your image and profile links.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await accountRequest(
        'profile',
        {
          ...(values.name.trim() ? { name: values.name.trim() } : {}),
          bio: values.bio,
          image: values.image,
          profile: {
            github: values.github,
            linkedin: values.linkedin,
            portfolio: values.portfolio,
          },
        },
        'PATCH',
      );
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profile could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout story="register">
      <AuthHeading
        eyebrow="Participant profile"
        title="Make this profile yours."
        highlight=""
        subtitle="Add the details teammates will see in your workspace. All fields are optional."
      />
      {loading ? (
        <p role="status">Loading your profile…</p>
      ) : (
        <form onSubmit={save} className={styles.form}>
          <div>
            {preview || values.image ? (
              <Image
                unoptimized
                width={84}
                height={84}
                className={styles.avatar}
                src={preview || values.image}
                alt="Your profile preview"
              />
            ) : (
              <div className={styles.avatar} aria-label="No profile image" />
            )}
            <label className={styles.field}>
              Preview profile image (optional)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
                    file.size > 2 * 1024 * 1024
                  ) {
                    setError('Choose a PNG, JPEG or WebP image under 2 MB.');
                    return;
                  }
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <p className={styles.hint}>
              Upload preview stays on this page. To save an image, use an existing image
              URL below; file uploads need a future upload service.
            </p>
          </div>
          <progress value={filled} max={6} aria-label="Optional profile completion" />
          <p className={styles.hint}>{filled} of 6 optional details added</p>
          {(['name', 'image', 'github', 'linkedin', 'portfolio'] as const).map((key) => (
            <TactileField
              key={key}
              label={`${{ name: 'Profile display name', image: 'Profile image URL', github: 'GitHub profile', linkedin: 'LinkedIn profile', portfolio: 'Portfolio' }[key]} (optional)`}
              value={values[key]}
              type={key === 'name' ? 'text' : 'url'}
              maxLength={key === 'name' ? 80 : 500}
              disabled={busy}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          ))}
          <label className={styles.field} htmlFor="profile-bio">
            Short bio (optional)
            <textarea
              id="profile-bio"
              className={styles.textarea}
              maxLength={2000}
              value={values.bio}
              disabled={busy}
              onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
              placeholder="What would you like to build?"
            />
          </label>
          {error && (
            <p className={styles.notice} role="alert">
              {error}
            </p>
          )}
          <PopButton type="submit" disabled={busy || !loaded}>
            {busy ? 'Saving…' : 'Save and continue →'}
          </PopButton>
          <PopButton href="/dashboard" cream>
            Skip for now
          </PopButton>
        </form>
      )}
    </AuthLayout>
  );
}
