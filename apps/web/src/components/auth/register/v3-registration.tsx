'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout, AuthHeading } from '@/components/niral-auth/auth-layout';
import { TactileField, PasswordStrength } from '@/components/niral-auth/form-controls';
import { accountRequest } from '@/components/niral-auth/account-api';
import { PopButton } from '@/components/niral/pop-button';
import styles from '@/components/niral-auth/auth.module.css';
import {
  blankRegistration,
  degrees,
  years,
  skills,
  tracks,
  guardedStep,
  registrationDraft,
  restoreRegistration,
  validateStep,
  type RegistrationValues,
} from './v3-model';

const draftKey = 'niral.registration.v3';
const headings = [
  'Build what matters.',
  'First, tell us about you.',
  'Where do you study?',
  'What do you love building?',
  'Create your secure account.',
  'Everything look right?',
];
const descriptions = [
  'Your journey to NIRAL Hackathon 2026 starts here.',
  'Use your name and email so we can create your participant account.',
  'Tell us about your current student enrollment.',
  'Choose what excites you. You can update your interests later.',
  'Choose a strong password you have not used elsewhere.',
  'Review your details before creating your NIRAL account.',
];
const actions = [
  'Start student registration',
  'Continue to academics',
  'Continue to skills',
  'Continue to security',
  'Review registration',
  'Submit Registration',
];

export function RegistrationExperience() {
  const [values, setValues] = useState<RegistrationValues>({ ...blankRegistration });
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [consents, setConsents] = useState([false, false, false, false]);
  const [search, setSearch] = useState('');
  const lock = useRef(false);
  const area = useRef<HTMLDivElement>(null);
  const latest = useRef(values);
  latest.current = values;
  const router = useRouter();
  useEffect(() => {
    let restored = { ...blankRegistration };
    try {
      restored = restoreRegistration(
        JSON.parse(
          sessionStorage.getItem(draftKey) ??
            sessionStorage.getItem('hackos.register.draft') ??
            'null',
        ),
      );
    } catch {
      /* Storage is optional. */
    }
    const sync = () => {
      const requested = Number(new URLSearchParams(location.search).get('step') ?? 0);
      const safe = guardedStep(requested, latest.current);
      setStep(safe);
      if (requested !== safe) history.replaceState(null, '', `/register?step=${safe}`);
      setErrors({});
    };
    queueMicrotask(() => {
      setValues(restored);
      latest.current = restored;
      sync();
      setReady(true);
    });
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(registrationDraft(values)));
    } catch {
      /* Keep the in-memory draft. */
    }
  }, [values, ready]);
  function go(target: number) {
    if (busy) return;
    const safe = guardedStep(target, values);
    setStep(safe);
    setErrors({});
    setMessage('');
    history.pushState(null, '', `/register?step=${safe}`);
    requestAnimationFrame(() => area.current?.querySelector<HTMLElement>('h1')?.focus());
  }
  function update(key: keyof RegistrationValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }
  function field(
    key: Exclude<keyof RegistrationValues, 'skills'>,
    label: string,
    placeholder = '',
    optional = false,
    type = 'text',
  ) {
    const autocomplete: Record<string, string> = {
      firstName: 'given-name',
      lastName: 'family-name',
      email: 'email',
      mobile: 'tel',
      password: 'new-password',
      confirm: 'new-password',
    };
    return (
      <TactileField
        key={key}
        label={`${label}${optional ? ' (optional)' : ' *'}`}
        value={values[key]}
        placeholder={placeholder}
        required={!optional}
        type={type}
        password={key === 'password' || key === 'confirm'}
        maxLength={
          key === 'password' || key === 'confirm'
            ? 128
            : key === 'email'
              ? 254
              : key === 'firstName'
                ? 39
                : key === 'lastName'
                  ? 40
                  : 120
        }
        autoComplete={autocomplete[key]}
        onChange={(e) => update(key, e.target.value)}
        onBlur={() =>
          setErrors((e) => ({
            ...e,
            [key]: validateStep(step, latest.current)[key] ?? '',
          }))
        }
        error={errors[key]}
      />
    );
  }
  function select(
    key: 'degree' | 'year' | 'experience' | 'track',
    label: string,
    options: string[],
    optional = false,
  ) {
    return (
      <div className={styles.field}>
        <label htmlFor={`register-${key}`}>
          {label}
          {optional ? ' (optional)' : ' *'}
        </label>
        <select
          id={`register-${key}`}
          className={styles.select}
          value={values[key]}
          required={!optional}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          onChange={(e) => update(key, e.target.value)}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        {errors[key] && (
          <span id={`${key}-error`} className={styles.error}>
            {errors[key]}
          </span>
        )}
      </div>
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    if (step < 5) {
      const next = validateStep(step, values);
      setErrors(next);
      if (Object.keys(next).length) {
        requestAnimationFrame(() =>
          area.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
        return;
      }
      go(step + 1);
      return;
    }
    const safe = guardedStep(5, values);
    if (safe !== 5) {
      go(safe);
      return;
    }
    if (!consents.slice(0, 4).every(Boolean)) {
      setMessage(
        'Accept the participation rules, privacy notice, code of conduct and student eligibility declaration to continue.',
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await accountRequest<{ message: string; emailDelivery: string }>(
        'register',
        {
          name: `${values.firstName.trim()} ${values.lastName.trim()}`,
          email: values.email.trim().toLowerCase(),
          password: values.password,
          college: values.institution.trim(),
          department: values.department.trim(),
          accountPolicyAccepted: true,
          student: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            displayName: values.displayName.trim(),
            phone: values.mobile.trim(),
            institution: values.institution.trim(),
            department: values.department.trim(),
            degree: values.degree,
            yearOfStudy: values.year,
            studentId: values.studentId,
            skills: values.skills,
            experience: values.experience,
            track: values.track,
            github: values.github,
            rulesAccepted: consents[0],
            privacyAccepted: consents[1],
            codeOfConductAccepted: consents[2],
            eligibilityConfirmed: consents[3],
          },
        },
      );
      try {
        sessionStorage.setItem('niral.verify.email', values.email.trim().toLowerCase());
        sessionStorage.setItem('niral.verify.delivery', result.emailDelivery);
      } catch {
        /* Verification supports manual email entry. */
      }
      setValues((v) => ({ ...v, password: '', confirm: '' }));
      router.push('/verify-email');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Registration is unavailable. Your details remain here.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story={step === 5 ? 'review' : 'register'}
      status={busy ? 'Submitting registration' : `Registration step ${step} of 5`}
    >
      <div ref={area}>
        <AuthHeading
          eyebrow={
            step
              ? `Student registration / ${String(step).padStart(2, '0')}`
              : 'Join NIRAL 2026'
          }
          title={headings[step]}
          highlight=""
          subtitle={descriptions[step]}
        />
        {!ready ? (
          <p role="status">Loading your registration…</p>
        ) : (
          <>
            {step > 0 && (
              <nav className={styles.wizardSteps} aria-label="Registration progress">
                {['You', 'Study', 'Skills', 'Security', 'Review'].map((label, i) => (
                  <button
                    type="button"
                    key={label}
                    aria-current={step === i + 1 ? 'step' : undefined}
                    disabled={busy || i + 1 > step}
                    onClick={() => go(i + 1)}
                  >
                    <span data-complete={i + 1 <= step} />
                    <small>{label}</small>
                  </button>
                ))}
              </nav>
            )}
            <form noValidate onSubmit={submit} className={styles.form} aria-busy={busy}>
              <fieldset disabled={busy} className={styles.formFields}>
                {step === 0 && (
                  <>
                    <div className={styles.welcomeBox}>
                      <h2>Welcome, future maker ✦</h2>
                      <p>
                        Create your student account first. You can create or join a team
                        after verifying your email and signing in.
                      </p>
                      <ul className={styles.checklist}>
                        {[
                          'A valid email address',
                          'Your academic information',
                          'A few skills and interests',
                          'A secure password',
                        ].map((t, i) => (
                          <li key={t}>
                            {i + 1}. {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className={styles.notice}>
                      Students only · Eligibility follows the{' '}
                      <Link href="/rules">published participation rules</Link>. No payment
                      is collected during account creation.
                    </p>
                    {values.firstName && (
                      <p className={styles.hint}>
                        Your saved details are ready. Continue to resume registration.
                      </p>
                    )}
                  </>
                )}
                {step === 1 && (
                  <>
                    <p className={styles.hint}>
                      Required details are marked with *. Use a personal or college email
                      you can access. Email is never publicly displayed.
                    </p>
                    <div className={styles.fieldGrid}>
                      {field('firstName', 'First name', 'e.g. Arjun')}
                      {field('lastName', 'Last name', 'e.g. Kumar')}
                    </div>
                    {field(
                      'displayName',
                      'Display name',
                      'How teammates will see you',
                      false,
                    )}
                    {field('email', 'Email address', 'you@example.com', false, 'email')}
                    {field('mobile', 'Mobile number', '+91 98765 43210', false, 'tel')}
                  </>
                )}
                {step === 2 && (
                  <>
                    <p className={styles.hint}>
                      Student eligibility will be reviewed according to the official NIRAL
                      rules.
                    </p>
                    {field(
                      'institution',
                      'College / institution',
                      'Full official institution name',
                    )}
                    {field(
                      'department',
                      'Department',
                      'e.g. Electronics and Communication',
                    )}
                    <div className={styles.fieldGrid}>
                      {select('degree', 'Degree / program', degrees)}
                      {select('year', 'Year of study', years)}
                    </div>
                    {field(
                      'studentId',
                      'Student / roll ID',
                      'Optional if available',
                      true,
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <p className={styles.hint}>
                      Skills help you explore relevant tracks; they are not used to reject
                      eligible participants. No minimum skill level.
                    </p>
                    <TactileField
                      label="Search skills"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div
                      className={styles.chips}
                      aria-label="Technical skills (optional)"
                    >
                      {skills
                        .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
                        .map((s) => (
                          <button
                            type="button"
                            key={s}
                            aria-pressed={values.skills.includes(s)}
                            onClick={() =>
                              setValues((v) => ({
                                ...v,
                                skills: v.skills.includes(s)
                                  ? v.skills.filter((x) => x !== s)
                                  : [...v.skills, s],
                              }))
                            }
                          >
                            {values.skills.includes(s) ? '✓ ' : '+ '}
                            {s}
                          </button>
                        ))}
                    </div>
                    {!skills.some((s) =>
                      s.toLowerCase().includes(search.toLowerCase()),
                    ) && (
                      <p role="status">
                        No matching skills. Try another search or continue.
                      </p>
                    )}
                    <p className={styles.hint} role="status">
                      {values.skills.length} skills selected · All interests are optional
                    </p>
                    {select(
                      'experience',
                      'Experience level',
                      ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                      true,
                    )}
                    {select('track', 'Preferred innovation track', tracks, true)}
                    {field(
                      'github',
                      'GitHub profile',
                      'https://github.com/username',
                      true,
                      'url',
                    )}
                  </>
                )}
                {step === 4 && (
                  <>
                    {field('password', 'Password', 'Create a strong password')}
                    <PasswordStrength password={values.password} />
                    {field('confirm', 'Confirm password', 'Repeat your password')}
                    <p className={styles.hint}>
                      Use a unique passphrase. Passwords stay in memory and are never
                      saved in your draft or shown in the review.
                    </p>
                  </>
                )}
                {step === 5 && (
                  <>
                    {[
                      {
                        title: 'Personal details',
                        step: 1,
                        pairs: [
                          ['Full name', `${values.firstName} ${values.lastName}`],
                          ['Display name', values.displayName],
                          ['Email', values.email],
                          ['Mobile', values.mobile],
                        ],
                      },
                      {
                        title: 'Academic information',
                        step: 2,
                        pairs: [
                          ['Institution', values.institution],
                          ['Department', values.department],
                          ['Program', values.degree],
                          ['Year', values.year],
                          ['Student ID', values.studentId],
                        ],
                      },
                      {
                        title: 'Skills and interests',
                        step: 3,
                        pairs: [
                          ['Skills', values.skills.join(', ')],
                          ['Experience', values.experience],
                          ['Track', values.track],
                          ['GitHub', values.github],
                        ],
                      },
                    ].map((section) => (
                      <section className={styles.reviewSection} key={section.title}>
                        <div className={styles.reviewHeader}>
                          <h2>{section.title}</h2>
                          <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => go(section.step)}
                          >
                            Edit {section.title.toLowerCase()}
                          </button>
                        </div>
                        <dl className={styles.details}>
                          {section.pairs.map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value || 'Not provided (optional)'}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                    <div className={styles.reviewHeader}>
                      <p>Security · Password hidden</p>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => go(4)}
                      >
                        Edit security
                      </button>
                    </div>
                    <p className={styles.notice}>
                      This creates your student account and saves your academic details,
                      interests and required consents. Event enrollment and any approved
                      payment are completed separately after email verification.
                    </p>
                    <details id="registration-privacy" className={styles.notice}>
                      <summary>Registration privacy notice</summary>
                      <p>
                        Your name, email, password, institution and department are sent
                        securely to the account service to create and verify your account.
                        Your student details, interests and required consent records are
                        saved with your account. Passwords are never saved in the draft.
                        Read the <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy review draft</Link> for current practices and unresolved retention arrangements.
                      </p>
                    </details>
                    <p className={styles.notice}>The <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</Link> are a review draft, pending organizer approval. These declarations do not record acceptance of that new draft.</p>
                    {[
                      <>
                        I have read and agree to the{' '}
                        <Link href="/rules" target="_blank" rel="noopener noreferrer">
                          NIRAL participation rules
                        </Link>
                      </>,
                      <>
                        I understand the{' '}
                        <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy review draft</Link> and processing
                        needed for registration
                      </>,
                      <>
                        I agree to follow the{' '}
                        <Link href="/rules" target="_blank" rel="noopener noreferrer">
                          event code of conduct
                        </Link>
                      </>,
                      <>
                        I confirm that I am currently a student and meet the published
                        eligibility rules
                      </>,
                    ].map((label, i) => (
                      <label className={styles.checkbox} key={i}>
                        <input
                          type="checkbox"
                          required
                          disabled={busy}
                          checked={consents[i]}
                          onChange={(e) =>
                            setConsents((v) =>
                              v.map((x, n) => (n === i ? e.target.checked : x)),
                            )
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </>
                )}
              </fieldset>
              {message && (
                <p role="alert" className={styles.notice}>
                  {message}
                </p>
              )}
              <div className={styles.actions}>
                {step > 0 && (
                  <PopButton cream disabled={busy} onClick={() => go(step - 1)}>
                    Back
                  </PopButton>
                )}
                <PopButton type="submit" disabled={busy} className={styles.submit}>
                  {busy ? 'Submitting…' : actions[step]} ↗
                </PopButton>
              </div>
            </form>
            <p className={styles.links}>
              Already registered? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
