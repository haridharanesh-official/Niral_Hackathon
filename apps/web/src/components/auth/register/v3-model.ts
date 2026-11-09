import { z } from 'zod';
import { validatePasswordPolicy } from '@hackos/shared';

export const degrees = [
  'B.E. / B.Tech',
  'B.Sc.',
  'BCA',
  'M.E. / M.Tech',
  'M.Sc.',
  'MCA',
  'Other eligible program',
];
export const years = [
  'First year',
  'Second year',
  'Third year',
  'Fourth year',
  'Fifth year / Other',
];
export const skills = [
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
export const tracks = [
  'AI + IoT',
  'Smart Agriculture',
  'Industrial Automation',
  'Healthcare IoT',
  'Smart Cities',
  'Robotics & Embedded',
];
export const blankRegistration = {
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  mobile: '',
  institution: '',
  department: '',
  degree: '',
  year: '',
  studentId: '',
  experience: '',
  track: '',
  github: '',
  skills: [] as string[],
  password: '',
  confirm: '',
};
export type RegistrationValues = typeof blankRegistration;
const optionalUrl = z
  .string()
  .refine(
    (v) => !v || (/^https?:\/\//i.test(v) && URL.canParse(v)),
    'Enter a complete http or https URL.',
  );
const schemas = [
  z.object({
    firstName: z.string().trim().min(2, 'Enter at least two characters.').max(39),
    lastName: z.string().trim().min(2, 'Enter at least two characters.').max(40),
    displayName: z.string().trim().min(2, 'Enter your display name.').max(80),
    email: z.email('Enter a valid email address.').max(254),
    mobile: z
      .string()
      .refine(
        (v) =>
          /^\+?[\d ()-]+$/.test(v) &&
          v.replace(/\D/g, '').length >= 8 &&
          v.replace(/\D/g, '').length <= 15,
        'Enter a valid phone number, including country code where applicable.',
      ),
  }),
  z.object({
    institution: z.string().trim().min(2, 'Enter your institution.').max(120),
    department: z.string().trim().min(2, 'Enter your department.').max(120),
    degree: z.string().refine((v) => degrees.includes(v), 'Select your degree.'),
    year: z.string().refine((v) => years.includes(v), 'Select your academic year.'),
    studentId: z.string().max(80),
  }),
  z.object({ github: optionalUrl, experience: z.string(), track: z.string() }),
  z
    .object({
      password: z.string().superRefine((v, ctx) => {
        for (const message of validatePasswordPolicy(v))
          ctx.addIssue({ code: 'custom', message });
      }),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      path: ['confirm'],
      message: 'Passwords must match.',
    }),
];
export function validateStep(
  step: number,
  values: RegistrationValues,
): Record<string, string> {
  const result = schemas[step - 1]?.safeParse(values);
  const errors: Record<string, string> = {};
  if (result && !result.success)
    for (const issue of result.error.issues)
      errors[String(issue.path[0])] ??= issue.message;
  return errors;
}
export function guardedStep(requested: number, values: RegistrationValues) {
  const target = Number.isInteger(requested) ? Math.min(5, Math.max(0, requested)) : 0;
  for (let s = 1; s < target; s++)
    if (Object.keys(validateStep(s, values)).length) return s;
  return target;
}
// Explicit allowlist: credentials and consent never enter browser draft storage.
export function registrationDraft(values: RegistrationValues) {
  const {
    firstName,
    lastName,
    displayName,
    email,
    mobile,
    institution,
    department,
    degree,
    year,
    studentId,
    experience,
    track,
    github,
    skills: selected,
  } = values;
  return {
    firstName,
    lastName,
    displayName,
    email,
    mobile,
    institution,
    department,
    degree,
    year,
    studentId,
    experience,
    track,
    github,
    skills: selected,
  };
}
export function restoreRegistration(raw: unknown): RegistrationValues {
  const next = { ...blankRegistration, skills: [] as string[] };
  if (!raw || typeof raw !== 'object') return next;
  for (const key of Object.keys(registrationDraft(next)) as (keyof ReturnType<
    typeof registrationDraft
  >)[]) {
    const value = (raw as Record<string, unknown>)[key];
    if (key === 'skills')
      next.skills = Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string' && skills.includes(v))
        : [];
    else if (typeof value === 'string') next[key] = value.slice(0, 254);
  }
  return next;
}
