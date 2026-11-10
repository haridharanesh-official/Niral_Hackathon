'use client';

import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { validatePasswordPolicy } from '@hackos/shared';
import { PopButton } from '@/components/niral/pop-button';
import {
  NiralAuthLayout,
  NiralAuthCard,
  NiralTextField,
  NiralPasswordField,
  NiralPasswordStrength,
  NiralStepProgress,
  NiralFormAlert,
  NiralChipSelect,
  NiralSuccessState,
} from './niral-auth-system';
import { accountRequest } from './account-api';
import styles from './niral-auth.module.css';

const DRAFT_KEY = 'niral.registration.draft';

const DEGREE_OPTIONS = [
  'B.E. / B.Tech',
  'B.Sc.',
  'BCA',
  'M.E. / M.Tech',
  'M.Sc.',
  'MCA',
  'Other eligible program',
];

const YEAR_OPTIONS = [
  'First year',
  'Second year',
  'Third year',
  'Fourth year',
  'Fifth year / Other',
];

const TRACK_OPTIONS = [
  'AI + IoT',
  'Smart Agriculture',
  'Industrial Automation',
  'Healthcare IoT',
  'Smart Cities',
  'Robotics & Embedded',
];

const SKILL_OPTIONS = [
  'Arduino',
  'ESP32',
  'Raspberry Pi',
  'Python',
  'Embedded C',
  'C++',
  'React',
  'Computer Vision',
  'AI / ML',
  'Robotics',
  'MQTT',
  'Cybersecurity',
];

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const STEPS = ['Account', 'Academics', 'Skills', 'Review', 'Confirmed'];

type FormState = {
  // Screen A
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  // Screen B
  institution: string;
  department: string;
  degree: string;
  yearOfStudy: string;
  phone: string;
  studentId: string;
  eligibilityConfirmed: boolean;
  // Screen C
  track: string;
  skills: string[];
  experience: string;
  github: string;
  // Screen D Consents
  rulesAccepted: boolean;
  privacyAccepted: boolean;
  codeOfConductAccepted: boolean;
  finalEligibilityAccepted: boolean;
};

const initialFormState: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,

  institution: '',
  department: '',
  degree: '',
  yearOfStudy: '',
  phone: '',
  studentId: '',
  eligibilityConfirmed: false,

  track: 'AI + IoT',
  skills: ['Arduino', 'ESP32', 'Python'],
  experience: 'Intermediate',
  github: '',

  rulesAccepted: false,
  privacyAccepted: false,
  codeOfConductAccepted: false,
  finalEligibilityAccepted: false,
};

export function NiralRegistrationWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailDelivery, setEmailDelivery] = useState('');
  const lock = useRef(false);

  // Restore non-sensitive draft on mount
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData((prev) => ({
            ...prev,
            fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
            email: typeof parsed.email === 'string' ? parsed.email : '',
            institution: typeof parsed.institution === 'string' ? parsed.institution : '',
            department: typeof parsed.department === 'string' ? parsed.department : '',
            degree: typeof parsed.degree === 'string' ? parsed.degree : '',
            yearOfStudy: typeof parsed.yearOfStudy === 'string' ? parsed.yearOfStudy : '',
            phone: typeof parsed.phone === 'string' ? parsed.phone : '',
            studentId: typeof parsed.studentId === 'string' ? parsed.studentId : '',
            track: typeof parsed.track === 'string' ? parsed.track : 'AI + IoT',
            skills: Array.isArray(parsed.skills) ? parsed.skills : ['Arduino', 'ESP32'],
            experience: typeof parsed.experience === 'string' ? parsed.experience : 'Intermediate',
            github: typeof parsed.github === 'string' ? parsed.github : '',
          }));
        }
      } catch {
        /* Optional draft storage */
      }
    });
  }, []);

  // Persist draft on change (excluding passwords & consents)
  useEffect(() => {
    try {
      const draft = {
        fullName: formData.fullName,
        email: formData.email,
        institution: formData.institution,
        department: formData.department,
        degree: formData.degree,
        yearOfStudy: formData.yearOfStudy,
        phone: formData.phone,
        studentId: formData.studentId,
        track: formData.track,
        skills: formData.skills,
        experience: formData.experience,
        github: formData.github,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* Optional draft storage */
    }
  }, [formData]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validateScreenA(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Enter your full name (at least 2 characters).';
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      errs.email = 'Enter a valid email address.';
    }
    const policyErrors = validatePasswordPolicy(formData.password);
    if (policyErrors.length > 0) {
      errs.password = policyErrors[0];
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.termsAccepted) {
      errs.termsAccepted = 'You must agree to the Terms of Service and Privacy Policy.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateScreenB(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.institution.trim() || formData.institution.trim().length < 2) {
      errs.institution = 'Enter your college or institution name.';
    }
    if (!formData.department.trim() || formData.department.trim().length < 2) {
      errs.department = 'Enter your department or branch of study.';
    }
    if (!formData.degree || !DEGREE_OPTIONS.includes(formData.degree)) {
      errs.degree = 'Select your degree program.';
    }
    if (!formData.yearOfStudy || !YEAR_OPTIONS.includes(formData.yearOfStudy)) {
      errs.yearOfStudy = 'Select your current academic year.';
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 8 || phoneDigits.length > 15) {
      errs.phone = 'Enter a valid phone number (8–15 digits) with country code.';
    }
    if (!formData.eligibilityConfirmed) {
      errs.eligibilityConfirmed =
        'You must confirm that you are currently an enrolled student.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateScreenC(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.track) {
      errs.track = 'Select a preferred innovation track.';
    }
    if (formData.skills.length === 0) {
      errs.skills = 'Select at least one skill or interest chip.';
    }
    if (
      formData.github &&
      !/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i.test(formData.github.trim())
    ) {
      errs.github = 'Enter a valid GitHub profile URL (e.g. https://github.com/username).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateScreenD(): boolean {
    const errs: Record<string, string> = {};
    if (!formData.rulesAccepted) {
      errs.rulesAccepted = 'You must accept the event rules.';
    }
    if (!formData.privacyAccepted) {
      errs.privacyAccepted = 'You must accept the privacy policy.';
    }
    if (!formData.codeOfConductAccepted) {
      errs.codeOfConductAccepted = 'You must agree to the code of conduct.';
    }
    if (!formData.finalEligibilityAccepted) {
      errs.finalEligibilityAccepted = 'You must certify your student eligibility.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmitRegistration(e: FormEvent) {
    e.preventDefault();
    if (lock.current || busy) return;

    if (!validateScreenD()) return;

    lock.current = true;
    setBusy(true);
    setServerError('');

    // Parse full name
    const parts = formData.fullName.trim().split(/\s+/);
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || parts[0] || 'Participant';
    const displayName = formData.fullName.trim();

    try {
      const response = await accountRequest<{
        message: string;
        emailDelivery?: string;
      }>('register', {
        name: displayName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        college: formData.institution.trim(),
        department: formData.department.trim(),
        accountPolicyAccepted: true,
        student: {
          firstName,
          lastName,
          displayName,
          phone: formData.phone.trim(),
          institution: formData.institution.trim(),
          department: formData.department.trim(),
          degree: formData.degree,
          yearOfStudy: formData.yearOfStudy,
          studentId: formData.studentId.trim() || undefined,
          skills: formData.skills,
          experience: formData.experience || undefined,
          track: formData.track || undefined,
          github: formData.github.trim() || undefined,
          rulesAccepted: true,
          privacyAccepted: true,
          codeOfConductAccepted: true,
          eligibilityConfirmed: true,
        },
      });

      setEmailDelivery(response.emailDelivery || 'accepted');
      try {
        sessionStorage.setItem('niral.verify.email', formData.email.trim().toLowerCase());
        sessionStorage.setItem('niral.verify.delivery', response.emailDelivery || 'accepted');
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* storage optional */
      }

      setStep(4); // Move to Screen E (Confirmed)
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please check your details and try again.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function handleNextStep(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    if (step === 0) {
      if (validateScreenA()) setStep(1);
    } else if (step === 1) {
      if (validateScreenB()) setStep(2);
    } else if (step === 2) {
      if (validateScreenC()) setStep(3);
    }
  }

  function handleToggleSkill(skill: string) {
    const current = formData.skills;
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    updateField('skills', next);
  }

  return (
    <NiralAuthLayout
      actionType="register"
      kicker="NIRAL 2026 · REGISTRATION"
      headlineTitle="Your innovation"
      headlineHighlight="starts here."
      description="Create your NIRAL participant account. Team formation, problem statements, and track enrollment open in your dashboard after verification."
    >
      <NiralAuthCard
        eyebrow="STUDENT REGISTRATION"
        title={
          step === 0
            ? 'Create your NIRAL account'
            : step === 1
              ? 'Academic & student profile'
              : step === 2
                ? 'Skills & innovation tracks'
                : step === 3
                  ? 'Review your details'
                  : 'Account created successfully!'
        }
        subtitle={
          step === 0
            ? 'Step 1 of 4: Enter your name and credentials to create your secure participant login.'
            : step === 1
              ? 'Step 2 of 4: Verify your student enrollment eligibility for NIRAL Hackathon 2026.'
              : step === 2
                ? 'Step 3 of 4: Select your preferred innovation area and hardware/software interests.'
                : step === 3
                  ? 'Step 4 of 4: Review your registration details and complete required consents.'
                  : 'Welcome to NIRAL 2026! Your participant account is ready.'
        }
      >
        {step < 4 && (
          <NiralStepProgress
            steps={STEPS}
            currentStep={step}
            onStepClick={(target) => {
              if (target < step) {
                setErrors({});
                setStep(target);
              }
            }}
          />
        )}

        <NiralFormAlert message={serverError} variant="error" />

        {/* ------------------------------------------------------------------ */}
        {/* SCREEN A — Create Account                                           */}
        {/* ------------------------------------------------------------------ */}
        {step === 0 && (
          <form className={styles.form} noValidate onSubmit={handleNextStep}>
            <NiralTextField
              label="Full name"
              placeholder="e.g. Aditi Sharma"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
              autoComplete="name"
              error={errors.fullName}
            />

            <NiralTextField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              autoComplete="email"
              error={errors.email}
            />

            <NiralPasswordField
              label="Password"
              autoComplete="new-password"
              placeholder="Create a strong password (min 12 chars)"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              error={errors.password}
            />

            <NiralPasswordStrength password={formData.password} />

            <NiralPasswordField
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
              error={errors.confirmPassword}
            />

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={formData.termsAccepted}
                onChange={(e) => updateField('termsAccepted', e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <Link
                  href="/terms-of-service"
                  target="_blank"
                  className="font-bold underline"
                >
                  Terms of Service
                </Link>{' '}
                and acknowledge the{' '}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="font-bold underline"
                >
                  Privacy Policy
                </Link>
                . <span className={styles.requiredAsterisk}>*</span>
              </span>
            </label>
            {errors.termsAccepted && (
              <span className={styles.fieldError} role="alert">
                {errors.termsAccepted}
              </span>
            )}

            <PopButton type="submit" className={styles.authSubmitButton}>
              Continue to Academics →
            </PopButton>

            <div className={styles.socialDisabledNotice}>
              Social registration (Google / GitHub) is disabled until official organizer credentials are confirmed.
            </div>

            <div className={styles.cardFooterLinks}>
              <span>Already registered for NIRAL 2026?</span>
              <Link href="/login">Sign In instead</Link>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SCREEN B — Academic Profile                                         */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <form className={styles.form} noValidate onSubmit={handleNextStep}>
            <NiralTextField
              label="College / institution"
              placeholder="Full official institution name"
              value={formData.institution}
              onChange={(e) => updateField('institution', e.target.value)}
              required
              error={errors.institution}
            />

            <NiralTextField
              label="Department / branch"
              placeholder="e.g. Computer Science / Electronics"
              value={formData.department}
              onChange={(e) => updateField('department', e.target.value)}
              required
              error={errors.department}
            />

            <div className={styles.fieldGroupRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="reg-degree" className={styles.label}>
                  <span>
                    Degree program <span className={styles.requiredAsterisk}>*</span>
                  </span>
                </label>
                <select
                  id="reg-degree"
                  className={`${styles.select} ${errors.degree ? styles.inputInvalid : ''}`}
                  value={formData.degree}
                  onChange={(e) => updateField('degree', e.target.value)}
                  required
                >
                  <option value="">Select degree</option>
                  {DEGREE_OPTIONS.map((deg) => (
                    <option key={deg} value={deg}>
                      {deg}
                    </option>
                  ))}
                </select>
                {errors.degree && (
                  <span className={styles.fieldError} role="alert">
                    {errors.degree}
                  </span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="reg-year" className={styles.label}>
                  <span>
                    Year of study <span className={styles.requiredAsterisk}>*</span>
                  </span>
                </label>
                <select
                  id="reg-year"
                  className={`${styles.select} ${errors.yearOfStudy ? styles.inputInvalid : ''}`}
                  value={formData.yearOfStudy}
                  onChange={(e) => updateField('yearOfStudy', e.target.value)}
                  required
                >
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                {errors.yearOfStudy && (
                  <span className={styles.fieldError} role="alert">
                    {errors.yearOfStudy}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.fieldGroupRow}>
              <NiralTextField
                label="Contact number (phone)"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
                error={errors.phone}
              />

              <NiralTextField
                label="Student / roll ID"
                placeholder="Optional ID"
                optional
                value={formData.studentId}
                onChange={(e) => updateField('studentId', e.target.value)}
              />
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={formData.eligibilityConfirmed}
                onChange={(e) =>
                  updateField('eligibilityConfirmed', e.target.checked)
                }
              />
              <span>
                I confirm that I am currently a bonafide student enrolled in an accredited educational program.{' '}
                <span className={styles.requiredAsterisk}>*</span>
              </span>
            </label>
            {errors.eligibilityConfirmed && (
              <span className={styles.fieldError} role="alert">
                {errors.eligibilityConfirmed}
              </span>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <PopButton
                type="button"
                cream
                onClick={() => setStep(0)}
                style={{ flex: '0 0 auto' }}
              >
                ← Back
              </PopButton>
              <PopButton
                type="submit"
                className={styles.authSubmitButton}
                style={{ flex: 1 }}
              >
                Continue to Skills →
              </PopButton>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SCREEN C — Skills and Interests                                     */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <form className={styles.form} noValidate onSubmit={handleNextStep}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>
                  Preferred innovation track{' '}
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              <NiralChipSelect
                options={TRACK_OPTIONS}
                selected={formData.track}
                onChange={(val) => updateField('track', val)}
              />
              {errors.track && (
                <span className={styles.fieldError} role="alert">
                  {errors.track}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>
                  Technology skills &amp; hardware interests{' '}
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
                <span className={styles.optionalTag}>Tap to select / deselect</span>
              </label>
              <NiralChipSelect
                options={SKILL_OPTIONS}
                selected={formData.skills}
                multi
                onChange={handleToggleSkill}
              />
              {errors.skills && (
                <span className={styles.fieldError} role="alert">
                  {errors.skills}
                </span>
              )}
            </div>

            <div className={styles.fieldGroupRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="reg-experience" className={styles.label}>
                  <span>Experience level</span>
                  <span className={styles.optionalTag}>(optional)</span>
                </label>
                <select
                  id="reg-experience"
                  className={styles.select}
                  value={formData.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                >
                  <option value="">Select experience</option>
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              <NiralTextField
                label="GitHub profile URL"
                placeholder="https://github.com/username"
                optional
                value={formData.github}
                onChange={(e) => updateField('github', e.target.value)}
                error={errors.github}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <PopButton
                type="button"
                cream
                onClick={() => setStep(1)}
                style={{ flex: '0 0 auto' }}
              >
                ← Back
              </PopButton>
              <PopButton
                type="submit"
                className={styles.authSubmitButton}
                style={{ flex: 1 }}
              >
                Review Registration →
              </PopButton>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SCREEN D — Review and Submit                                        */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <form
            className={styles.form}
            noValidate
            onSubmit={handleSubmitRegistration}
          >
            {/* Account Summary */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <h3 className={styles.reviewCardTitle}>1. Account Information</h3>
                <button
                  type="button"
                  className={styles.reviewEditButton}
                  onClick={() => setStep(0)}
                >
                  Edit
                </button>
              </div>
              <div className={styles.reviewDetailsGrid}>
                <span className={styles.reviewDetailLabel}>Full Name:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.fullName}
                </span>
                <span className={styles.reviewDetailLabel}>Email:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.email}
                </span>
                <span className={styles.reviewDetailLabel}>Password:</span>
                <span className={styles.reviewDetailValue}>••••••••••••</span>
              </div>
            </div>

            {/* Academic Summary */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <h3 className={styles.reviewCardTitle}>2. Academic Details</h3>
                <button
                  type="button"
                  className={styles.reviewEditButton}
                  onClick={() => setStep(1)}
                >
                  Edit
                </button>
              </div>
              <div className={styles.reviewDetailsGrid}>
                <span className={styles.reviewDetailLabel}>Institution:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.institution}
                </span>
                <span className={styles.reviewDetailLabel}>Department:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.department}
                </span>
                <span className={styles.reviewDetailLabel}>Degree &amp; Year:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.degree} ({formData.yearOfStudy})
                </span>
                <span className={styles.reviewDetailLabel}>Phone:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.phone}
                </span>
                {formData.studentId && (
                  <>
                    <span className={styles.reviewDetailLabel}>Student ID:</span>
                    <span className={styles.reviewDetailValue}>
                      {formData.studentId}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Skills Summary */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <h3 className={styles.reviewCardTitle}>3. Track &amp; Skills</h3>
                <button
                  type="button"
                  className={styles.reviewEditButton}
                  onClick={() => setStep(2)}
                >
                  Edit
                </button>
              </div>
              <div className={styles.reviewDetailsGrid}>
                <span className={styles.reviewDetailLabel}>Preferred Track:</span>
                <span className={styles.reviewDetailValue}>{formData.track}</span>
                <span className={styles.reviewDetailLabel}>Skills:</span>
                <span className={styles.reviewDetailValue}>
                  {formData.skills.join(', ')}
                </span>
                {formData.experience && (
                  <>
                    <span className={styles.reviewDetailLabel}>Experience:</span>
                    <span className={styles.reviewDetailValue}>
                      {formData.experience}
                    </span>
                  </>
                )}
                {formData.github && (
                  <>
                    <span className={styles.reviewDetailLabel}>GitHub:</span>
                    <span className={styles.reviewDetailValue}>
                      {formData.github}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Required Consents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.rulesAccepted}
                  onChange={(e) => updateField('rulesAccepted', e.target.checked)}
                />
                <span>
                  I have read and agree to the official{' '}
                  <Link href="/rules" target="_blank" className="font-bold underline">
                    NIRAL Hackathon 2026 Event Rules
                  </Link>
                  . <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              {errors.rulesAccepted && (
                <span className={styles.fieldError} role="alert">
                  {errors.rulesAccepted}
                </span>
              )}

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.privacyAccepted}
                  onChange={(e) => updateField('privacyAccepted', e.target.checked)}
                />
                <span>
                  I understand the Privacy Policy and consent to processing my student details for event administration.{' '}
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              {errors.privacyAccepted && (
                <span className={styles.fieldError} role="alert">
                  {errors.privacyAccepted}
                </span>
              )}

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.codeOfConductAccepted}
                  onChange={(e) =>
                    updateField('codeOfConductAccepted', e.target.checked)
                  }
                />
                <span>
                  I agree to abide by the NIRAL Code of Conduct and respect all fellow participants and mentors.{' '}
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              {errors.codeOfConductAccepted && (
                <span className={styles.fieldError} role="alert">
                  {errors.codeOfConductAccepted}
                </span>
              )}

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.finalEligibilityAccepted}
                  onChange={(e) =>
                    updateField('finalEligibilityAccepted', e.target.checked)
                  }
                />
                <span>
                  I certify that all details submitted are genuine and I meet published eligibility requirements.{' '}
                  <span className={styles.requiredAsterisk}>*</span>
                </span>
              </label>
              {errors.finalEligibilityAccepted && (
                <span className={styles.fieldError} role="alert">
                  {errors.finalEligibilityAccepted}
                </span>
              )}
            </div>

            <p className={styles.fieldHint}>
              <strong>Note:</strong> Initial registration creates your participant account.
              Event application, team formation, and track confirmations occur inside the dashboard after sign-in.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <PopButton
                type="button"
                cream
                onClick={() => setStep(2)}
                disabled={busy}
                style={{ flex: '0 0 auto' }}
              >
                ← Back
              </PopButton>
              <PopButton
                type="submit"
                className={styles.authSubmitButton}
                disabled={busy}
                style={{ flex: 1 }}
              >
                {busy ? 'Creating account…' : 'Create NIRAL Account →'}
              </PopButton>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SCREEN E — Account Created                                          */}
        {/* ------------------------------------------------------------------ */}
        {step === 4 && (
          <NiralSuccessState
            title="Account Created Successfully!"
            message={
              emailDelivery === 'accepted'
                ? `Welcome to NIRAL 2026, ${formData.fullName}! A verification link was sent to ${formData.email}. Please verify your inbox before signing in.`
                : `Welcome to NIRAL 2026, ${formData.fullName}! Your account has been registered. You can now proceed to sign in.`
            }
            primaryAction={{
              label: 'Sign In to Workspace →',
              href: '/login',
            }}
            secondaryAction={{
              label: 'Verify Email Link',
              href: '/verify-email',
            }}
          />
        )}
      </NiralAuthCard>
    </NiralAuthLayout>
  );
}

