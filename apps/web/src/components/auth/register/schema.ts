import { z } from "zod";

export const SKILLS = [
  "Arduino",
  "Raspberry Pi",
  "ESP32",
  "Embedded C",
  "Python",
  "C++",
  "JavaScript",
  "React",
  "Node.js",
  "AI / ML",
  "Computer Vision",
  "Cloud Computing",
  "MQTT",
  "Docker",
  "PCB Design",
  "Robotics",
  "Cybersecurity",
] as const;

export const THEMES = [
  "Industrial Automation",
  "Smart Agriculture",
  "Healthcare IoT",
  "Smart Cities",
  "Energy Management",
  "AI + IoT",
] as const;

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

export const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "123456789012",
  "qwertyuiop12",
  "adminadmin12",
  "hackos123456",
  "welcome12345",
]);

export type RegisterStep =
  | "landing"
  | "basic"
  | "academic"
  | "skills"
  | "portfolio"
  | "password"
  | "consent"
  | "success";

export const REGISTER_STEPS: RegisterStep[] = [
  "landing",
  "basic",
  "academic",
  "skills",
  "portfolio",
  "password",
  "consent",
  "success",
];

export type OnboardingDraft = {
  method: "email" | "google" | "github";
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  mobile: string;
  country: string;
  state: string;
  city: string;
  userType: "participant" | "professional";
  college: string;
  department: string;
  degree: string;
  yearOfStudy: string;
  studentId: string;
  company: string;
  designation: string;
  experience: string;
  industry: string;
  skills: string[];
  experienceLevel: (typeof EXPERIENCE_LEVELS)[number] | "";
  preferredThemes: string[];
  github: string;
  linkedin: string;
  website: string;
  portfolio: string;
  resumeName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptConduct: boolean;
  newsletter: boolean;
  sponsorUpdates: boolean;
  futureHackathons: boolean;
  registrationId?: string;
  verificationToken?: string;
  emailVerified?: boolean;
};

export const emptyDraft = (): OnboardingDraft => ({
  method: "email",
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  mobile: "",
  country: "India",
  state: "",
  city: "",
  userType: "participant",
  college: "",
  department: "",
  degree: "",
  yearOfStudy: "",
  studentId: "",
  company: "",
  designation: "",
  experience: "",
  industry: "",
  skills: [],
  experienceLevel: "",
  preferredThemes: [],
  github: "",
  linkedin: "",
  website: "",
  portfolio: "",
  resumeName: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptConduct: false,
  newsletter: false,
  sponsorUpdates: false,
  futureHackathons: true,
});

export const basicSchema = z.object({
  firstName: z.string().min(2, "2–50 characters").max(50),
  lastName: z.string().min(2, "2–50 characters").max(50),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(40),
  email: z.string().email("Enter a valid email address"),
  mobile: z
    .string()
    .min(8, "Enter a valid mobile number")
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, "Use digits and + ( ) - only"),
  country: z.string().min(2),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
});

export const academicSchema = z.discriminatedUnion("userType", [
  z.object({
    userType: z.literal("participant"),
    college: z.string().min(2, "College / University is required"),
    department: z.string().min(2, "Department is required"),
    degree: z.string().min(2, "Degree is required"),
    yearOfStudy: z.string().min(1, "Year of study is required"),
    studentId: z.string().optional(),
  }),
  z.object({
    userType: z.literal("professional"),
    company: z.string().min(2, "Company is required"),
    designation: z.string().min(2, "Designation is required"),
    experience: z.string().min(1, "Experience is required"),
    industry: z.string().min(2, "Industry is required"),
  }),
]);

export const skillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  preferredThemes: z
    .array(z.string())
    .min(1, "Choose at least one theme")
    .max(3, "Choose up to three themes"),
});

export const portfolioSchema = z.object({
  github: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  resumeName: z.string().optional(),
});

export function passwordIssues(
  password: string,
  ctx: { name?: string; email?: string },
) {
  const issues: string[] = [];
  if (password.length < 12) issues.push("At least 12 characters");
  if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
  if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
  if (!/[0-9]/.test(password)) issues.push("One number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("One special character");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    issues.push("Avoid common passwords");
  }
  const lowered = password.toLowerCase();
  if (ctx.name && ctx.name.length > 2 && lowered.includes(ctx.name.toLowerCase())) {
    issues.push("Should not contain your name");
  }
  const local = ctx.email?.split("@")[0];
  if (local && local.length > 2 && lowered.includes(local.toLowerCase())) {
    issues.push("Should not contain your email");
  }
  return issues;
}

export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Weak" | "Fair" | "Strong" | "Excellent" | "Too short";
} {
  if (!password) return { score: 0, label: "Too short" };
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { score: 1, label: "Weak" };
  if (score === 2) return { score: 2, label: "Fair" };
  if (score === 3) return { score: 3, label: "Strong" };
  return { score: 4, label: "Excellent" };
}

export const consentSchema = z.object({
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "You must accept the Terms of Service"),
  acceptPrivacy: z
    .boolean()
    .refine((v) => v === true, "You must accept the Privacy Policy"),
  acceptConduct: z
    .boolean()
    .refine((v) => v === true, "You must accept the Code of Conduct"),
  newsletter: z.boolean(),
  sponsorUpdates: z.boolean(),
  futureHackathons: z.boolean(),
});
