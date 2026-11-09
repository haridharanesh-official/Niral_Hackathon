'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PopButton } from '@/components/niral/pop-button';
import { AuthHeading, AuthLayout } from './auth-layout';
import { TactileField } from './form-controls';
import { accountRequest } from './account-api';
import styles from './auth.module.css';
export type EventConfig = {
  id: string;
  name: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  hasExactTimes: boolean;
  eventMode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  registrationEnabled: boolean;
  registrationPaymentMode?: 'FREE' | 'PAID' | 'DISABLED';
  feeAmountMinor?: number;
  taxAmountMinor?: number;
  feeCurrency?: string;

  status: string;
  registrationStartsAt: string | null;
  registrationEndsAt: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  settings?: {
    studentIdRequired?: boolean;
    eligibilityText?: string;
    rulesText?: string;
    tracks?: string[];
  };
};
type Application = {
  institution: string;
  department: string;
  degree: string;
  yearOfStudy: string;
  phone: string;
  studentId: string;
  interests: string[];
  technologies: string[];
  skills: string;
};
type Enrollment = {
  id: string;
  registrationId: string;
  status: string;
  createdAt: string;
  applicationData?: Application & { name: string; email: string };
  consentAcceptedAt: string;
  emailDelivery?: string;
};
type EnrollmentResponse = {
  event: EventConfig | null;
  enrollment: Enrollment | null;
  announcement?: { title: string; body: string; createdAt: string } | null;
};
const blank: Application = {
  institution: '',
  department: '',
  degree: '',
  yearOfStudy: '',
  phone: '',
  studentId: '',
  interests: [],
  technologies: [],
  skills: '',
};
function isOpen(event: EventConfig) {
  const now = Date.now();
  return (
    event.registrationEnabled &&
    event.registrationPaymentMode !== 'DISABLED' &&
    event.status === 'REGISTRATION_OPEN' &&
    (!event.registrationStartsAt || Date.parse(event.registrationStartsAt) <= now) &&
    (!event.registrationEndsAt || Date.parse(event.registrationEndsAt) >= now)
  );
}
function EventDetails({ event }: { event: EventConfig }) {
  return (
    <dl className={styles.details}>
      <dt>Event</dt>
      <dd>{event.name}</dd>
      <dt>Dates</dt>
      <dd>
        {new Intl.DateTimeFormat('en-IN', {
          dateStyle: 'medium',
          timeZone: event.hasExactTimes ? event.timezone : 'UTC',
        }).formatRange(new Date(event.startsAt), new Date(event.endsAt))}
        {!event.hasExactTimes ? ' · Exact timings TBA' : ''}
      </dd>
      <dt>Team size</dt>
      <dd>
        {event.minTeamSize}–{event.maxTeamSize} members
      </dd>
      <dt>Eligibility</dt>
      <dd>
        {event.settings?.eligibilityText ??
          'Confirm eligibility with the organizers before submitting.'}
      </dd>
    </dl>
  );
}
export function ApplicationExperience({
  identity,
}: {
  identity: { name: string; email: string; userId: string };
}) {
  const [data, setData] = useState<EnrollmentResponse | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [step, setStep] = useState(0),
    [values, setValues] = useState<Application>(blank),
    [interests, setInterests] = useState(''),
    [technologies, setTechnologies] = useState(''),
    [consent, setConsent] = useState(false),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [draftMessage, setDraftMessage] = useState('');
  const lock = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  function load() {
    setLoading(true);
    setError('');
    accountRequest<EnrollmentResponse>('application')
      .then((result) => {
        setData(result);
        if (result.event) {
          try {
            const raw = sessionStorage.getItem(
              `niral.apply.${identity.userId}.${result.event.id}`,
            );
            if (raw) {
              const draft = JSON.parse(raw);
              setValues({ ...blank, ...draft });
              setInterests((draft.interests ?? []).join(', '));
              setTechnologies((draft.technologies ?? []).join(', '));
              setDraftMessage('Your saved draft was restored.');
            }
          } catch {
            /* Draft is optional. */
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    const control = new AbortController();
    fetch('/api/account/application', { signal: control.signal, cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw Error(result.message ?? 'Unable to load your application.');
        setData(result);
        if (result.event) {
          try {
            const raw = sessionStorage.getItem(
              `niral.apply.${identity.userId}.${result.event.id}`,
            );
            if (raw) {
              const draft = JSON.parse(raw);
              setValues({ ...blank, ...draft });
              setInterests((draft.interests ?? []).join(', '));
              setTechnologies((draft.technologies ?? []).join(', '));
              setDraftMessage('Your saved draft was restored.');
            }
          } catch {
            /* Draft is optional. */
          }
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!control.signal.aborted) setLoading(false);
      });
    return () => control.abort();
  }, [identity.userId]);
  const application = {
    ...values,
    interests: interests
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    technologies: technologies
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  };
  function validate() {
    if (
      step === 1 &&
      (values.institution.trim().length < 2 ||
        values.department.trim().length < 2 ||
        values.degree.trim().length < 2)
    )
      return 'Enter your institution, department and degree/program.';
    if (
      step === 1 &&
      data?.event?.settings?.studentIdRequired &&
      !values.studentId.trim()
    )
      return 'Student ID is required by this event policy.';
    if (step === 1 && (!values.yearOfStudy.trim() || !values.phone.trim()))
      return 'Enter your academic year and contact number.';
    if (application.interests.length > 12 || application.technologies.length > 20)
      return 'Use at most 12 interests and 20 technologies.';
    if (application.interests.concat(application.technologies).some((v) => v.length > 80))
      return 'Keep each interest or technology under 80 characters.';
    return '';
  }
  function go(next: number) {
    const message = next > step ? validate() : '';
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep(next);
    setConfirm(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function save() {
    if (!data?.event) return;
    try {
      sessionStorage.setItem(
        `niral.apply.${identity.userId}.${data.event.id}`,
        JSON.stringify(application),
      );
      setDraftMessage(
        'Draft saved in this browser session. No application has been submitted.',
      );
    } catch {
      setDraftMessage(
        'This browser cannot save a draft. Keep this page open to continue.',
      );
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current || !data?.event) return;
    if (!consent || !confirm) {
      setError('Accept the declaration and confirm final submission.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await accountRequest<Enrollment>('application', {
        eventId: data.event.id,
        mode:
          data.event.eventMode === 'ONLINE'
            ? 'ONLINE'
            : data.event.eventMode === 'OFFLINE'
              ? 'ONSITE'
              : 'HYBRID',
        application,
        rulesAccepted: true,
        eligibilityConfirmed: true,
        privacyAccepted: true,
        codeOfConductAccepted: true,
      });
      try {
        sessionStorage.removeItem(`niral.apply.${identity.userId}.${data.event.id}`);
        sessionStorage.setItem(
          'niral.application.emailDelivery',
          result.emailDelivery ?? 'unknown',
        );
      } catch {
        /* Submission succeeded even without draft storage. */
      }
      router.replace(
        data.event.registrationPaymentMode === 'PAID'
          ? `/dashboard/payments/checkout/${result.id}`
          : '/dashboard/application',
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Submission failed. Your details remain here.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      story={step === 3 ? 'review' : 'apply'}
      status={
        busy
          ? 'Submitting application for review'
          : loading
            ? 'Loading event configuration'
            : `Application step ${step + 1} of 4`
      }
    >
      <AuthHeading
        eyebrow="Your NIRAL application"
        title={step === 3 ? 'One last' : 'Make your'}
        highlight={step === 3 ? 'look.' : 'next move.'}
        subtitle="Your account is ready. Complete event enrollment separately."
      />
      {loading ? (
        <p role="status">Loading your event and enrollment…</p>
      ) : !data?.event ? (
        <div className={styles.notice}>
          <p role="alert">{error || 'No published event is currently available.'}</p>
          <button className={styles.textButton} onClick={load}>
            Retry
          </button>
        </div>
      ) : data.enrollment ? (
        <div className={styles.success}>
          <p>You already have an application for this event.</p>
          <PopButton href="/dashboard/application">View application status →</PopButton>
        </div>
      ) : !isOpen(data.event) ? (
        <div className={styles.notice}>
          <h2>Applications are not open</h2>
          <EventDetails event={data.event} />
          <p>
            The organizers have not enabled applications for the current registration
            window.
          </p>
          <Link href="/updates">View official updates</Link>
        </div>
      ) : (
        <>
          {data.event.registrationPaymentMode === 'PAID' && (
            <p className={styles.notice}>
              Approved enrollment fee:{' '}
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: data.event.feeCurrency ?? 'INR',
              }).format(
                ((data.event.feeAmountMinor ?? 0) + (data.event.taxAmountMinor ?? 0)) /
                  100,
              )}{' '}
              including configured tax. Your enrollment stays pending until payment is
              captured and verified.
            </p>
          )}
          <nav className={styles.steps} aria-label="Application progress">
            {['Personal', 'Academic', 'Interests', 'Review'].map((label, i) => (
              <button
                type="button"
                key={label}
                disabled={i > step}
                onClick={() => go(i)}
                aria-current={step === i ? 'step' : undefined}
              >
                {i + 1}. {label}
              </button>
            ))}
          </nav>
          <h2 tabIndex={-1} ref={heading} style={{ fontSize: 24, marginBottom: 20 }}>
            {
              [
                'Personal information',
                'Academic information',
                'Participation interests',
                'Review your application',
              ][step]
            }
          </h2>
          <form className={styles.form} onSubmit={submit} noValidate>
            {step === 0 && (
              <>
                <div className={styles.notice}>
                  <strong>{identity.name}</strong>
                  <p>{identity.email} · Verified account identity</p>
                  <p className={styles.hint}>
                    Your identity comes from your authenticated account.
                  </p>
                </div>
                <TactileField
                  label="Contact number (optional)"
                  type="tel"
                  autoComplete="tel"
                  maxLength={32}
                  value={values.phone}
                  onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                />
                <EventDetails event={data.event} />
              </>
            )}
            {step === 1 && (
              <>
                {(
                  [
                    'institution',
                    'department',
                    'degree',
                    'yearOfStudy',
                    'phone',
                    'studentId',
                  ] as const
                ).map((key) => (
                  <TactileField
                    key={key}
                    label={
                      {
                        institution: 'College / Institution',
                        department: 'Department',
                        degree: 'Degree / Program',
                        yearOfStudy: 'Year of study',
                        phone: 'Mobile number',
                        studentId: 'Student ID (required only by event policy)',
                      }[key]
                    }
                    value={values[key]}
                    maxLength={key === 'yearOfStudy' ? 40 : 120}
                    required={
                      key !== 'studentId' || !!data.event?.settings?.studentIdRequired
                    }
                    error={
                      error && key !== 'yearOfStudy' && values[key].trim().length < 2
                        ? 'Enter at least two characters.'
                        : undefined
                    }
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  />
                ))}
              </>
            )}
            {step === 2 && (
              <>
                <TactileField
                  label="Areas of interest (optional)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  required
                  maxLength={960}
                  placeholder="Separate your interests with commas"
                />
                <TactileField
                  label="Preferred technologies (optional)"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  required
                  maxLength={1600}
                  placeholder="Separate technologies with commas"
                />
                <label className={styles.field}>
                  Relevant skills (optional)
                  <textarea
                    className={styles.textarea}
                    value={values.skills}
                    onChange={(e) => setValues((v) => ({ ...v, skills: e.target.value }))}
                    maxLength={1000}
                  />
                </label>
                <p className={styles.hint}>
                  These are your interests, not an official track selection.{' '}
                  {data.event.settings?.tracks?.length
                    ? `Published tracks: ${data.event.settings.tracks.join(', ')}`
                    : 'Official track choices have not been published.'}
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <div className={styles.reviewSection}>
                  <h2>Verified identity</h2>
                  <p>{identity.name}</p>
                  <p>{identity.email}</p>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => go(0)}
                  >
                    Edit contact details
                  </button>
                </div>
                <div className={styles.reviewSection}>
                  <h2>Academics</h2>
                  <p>
                    {values.institution} · {values.department}
                  </p>
                  <p>
                    {values.degree} · {values.yearOfStudy || 'Year not provided'}
                  </p>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => go(1)}
                  >
                    Edit academic information
                  </button>
                </div>
                <div className={styles.reviewSection}>
                  <h2>Interests</h2>
                  <p>{application.interests.join(', ')}</p>
                  <p>{application.technologies.join(', ')}</p>
                  <p>{values.skills}</p>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => go(2)}
                  >
                    Edit participation interests
                  </button>
                </div>
                <EventDetails event={data.event} />
                {data.event.settings?.rulesText && (
                  <p className={styles.notice}>{data.event.settings.rulesText}</p>
                )}
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I have read the{' '}
                    <Link href="/rules" target="_blank" rel="noopener noreferrer">
                      event rules
                    </Link>
                    , confirmed my eligibility with the organizers and declare these
                    details accurate. I accept the privacy notice and event code of
                    conduct.
                  </span>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={confirm}
                    onChange={(e) => setConfirm(e.target.checked)}
                  />
                  <span>
                    I confirm this final submission for organizer review. Paid enrollment
                    is confirmed only after verified capture.
                  </span>
                </label>
              </>
            )}
            {error && (
              <p role="alert" className={styles.notice}>
                {error}
              </p>
            )}
            {draftMessage && (
              <p role="status" className={styles.hint}>
                {draftMessage}
              </p>
            )}
            <div className={styles.actions}>
              {step > 0 && (
                <PopButton cream onClick={() => go(step - 1)} disabled={busy}>
                  Back
                </PopButton>
              )}
              {step < 3 ? (
                <PopButton onClick={() => go(step + 1)}>Continue →</PopButton>
              ) : (
                <PopButton type="submit" disabled={busy || !consent || !confirm}>
                  {busy ? 'Submitting…' : 'Submit Application →'}
                </PopButton>
              )}
              <button
                type="button"
                className={styles.textButton}
                onClick={save}
                disabled={busy}
              >
                Save draft
              </button>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
export function ApplicationStatus() {
  const [data, setData] = useState<EnrollmentResponse | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [emailDelivery, setEmailDelivery] = useState('');
  function refresh() {
    setLoading(true);
    accountRequest<EnrollmentResponse>('application')
      .then((result) => {
        setData(result);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/account/application', { cache: 'no-store', signal: c.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.message ?? 'Unable to load application');
        setData(body);
        try {
          setEmailDelivery(
            sessionStorage.getItem('niral.application.emailDelivery') ?? '',
          );
        } catch {
          /* Optional feedback. */
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);
  const e = data?.enrollment;
  const labels: Record<string, string> = {
    PENDING: 'Pending organizer review',
    CONFIRMED: 'Confirmed',
    WAITLISTED: 'Waitlisted',
    REJECTED: 'Not selected',
    WITHDRAWN: 'Withdrawn',
  };
  return (
    <AuthLayout
      story="status"
      status={e ? (labels[e.status] ?? e.status) : 'Loading saved application'}
    >
      <AuthHeading
        eyebrow="Application status"
        title={e ? 'Your application,' : 'Your next'}
        highlight={e ? 'at a glance.' : 'chapter.'}
        subtitle="Your saved record and current organizer decision."
      />
      {loading ? (
        <p role="status">Loading your application…</p>
      ) : error ? (
        <div className={styles.notice} role="alert">
          {error}
        </div>
      ) : e && data?.event ? (
        <>
          <div className={styles.success}>
            <h2 style={{ fontSize: 24 }}>{labels[e.status] ?? e.status}</h2>
            <p>
              {e.status === 'PENDING'
                ? 'Your application is saved and awaiting a decision. This is not an approval.'
                : 'This status comes from your event application record.'}
            </p>
          </div>
          <dl className={styles.details}>
            <dt>Participant</dt>
            <dd>{e.applicationData?.name ?? 'Account participant'}</dd>
            <dt>Registration ID</dt>
            <dd>{e.registrationId}</dd>
            <dt>Application date</dt>
            <dd>
              {new Intl.DateTimeFormat('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: data.event.timezone,
              }).format(new Date(e.createdAt))}
            </dd>
            <dt>Declaration accepted</dt>
            <dd>
              {e.consentAcceptedAt
                ? 'Recorded with submission'
                : 'Not recorded for this historical application'}
            </dd>
          </dl>
          <EventDetails event={data.event} />
          {emailDelivery === 'failed' && (
            <p className={styles.notice}>
              Your application was saved, but its confirmation email could not be sent.
              This page is your current record.
            </p>
          )}
          {data.announcement && (
            <div className={styles.notice}>
              <h2>Latest event announcement</h2>
              <strong>{data.announcement.title}</strong>
              <p>{data.announcement.body}</p>
            </div>
          )}
        </>
      ) : (
        <div className={styles.notice}>
          <p>No saved application for the active event.</p>
          <PopButton href="/apply">Apply to NIRAL →</PopButton>
        </div>
      )}
      <div className={styles.actions} style={{ marginTop: 24 }}>
        <button
          type="button"
          className={styles.textButton}
          onClick={refresh}
          disabled={loading}
        >
          Refresh status
        </button>
        <PopButton href="/dashboard" cream>
          Participant dashboard
        </PopButton>
      </div>
    </AuthLayout>
  );
}
