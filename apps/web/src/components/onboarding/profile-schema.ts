import {
  INTEREST_DOMAINS,
  SKILL_CATALOG,
  SKILL_LEVELS,
  type ParticipantType,
  type SkillLevel,
  type UserProfileData,
} from "@hackos/shared";
import { z } from "zod";

export const PROFILE_STEPS = [
  "personal",
  "background",
  "skills",
  "interests",
  "portfolio",
] as const;

export type ProfileStep = (typeof PROFILE_STEPS)[number];

export const PROFILE_STEP_LABELS: Record<ProfileStep, string> = {
  personal: "Personal",
  background: "Academic / Professional",
  skills: "Skills",
  interests: "Interests",
  portfolio: "Portfolio",
};

export type ProfileDraft = {
  name: string;
  participantType: ParticipantType;
  photoDataUrl: string;
  dateOfBirth: string;
  gender: string;
  pronouns: string;
  nationality: string;
  language: string;
  timezone: string;
  institution: string;
  department: string;
  degree: string;
  year: string;
  studentId: string;
  company: string;
  role: string;
  yearsExperience: string;
  industry: string;
  organization: string;
  researchDomain: string;
  publications: string;
  skills: Record<string, SkillLevel | "">;
  customSkill: string;
  customSkills: string[];
  interests: string[];
  github: string;
  linkedin: string;
  website: string;
  kaggle: string;
  devpost: string;
  researchgate: string;
  resumeName: string;
  bio: string;
};

export const emptyProfileDraft = (): ProfileDraft => ({
  name: "",
  participantType: "student",
  photoDataUrl: "",
  dateOfBirth: "",
  gender: "",
  pronouns: "",
  nationality: "India",
  language: "EN",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  institution: "",
  department: "",
  degree: "",
  year: "",
  studentId: "",
  company: "",
  role: "",
  yearsExperience: "",
  industry: "",
  organization: "",
  researchDomain: "",
  publications: "",
  skills: Object.fromEntries(SKILL_CATALOG.map((s) => [s, "" as const])),
  customSkill: "",
  customSkills: [],
  interests: [],
  github: "",
  linkedin: "",
  website: "",
  kaggle: "",
  devpost: "",
  researchgate: "",
  resumeName: "",
  bio: "",
});

export const DRAFT_KEY = "hackos.profile.draft";

export function draftToProfile(draft: ProfileDraft): UserProfileData {
  const skills: Record<string, SkillLevel> = {};
  for (const [k, v] of Object.entries(draft.skills)) {
    if (v) skills[k] = v;
  }
  for (const custom of draft.customSkills) {
    if (!skills[custom]) skills[custom] = "Beginner";
  }

  return {
    participantType: draft.participantType,
    personal: {
      photoUrl: draft.photoDataUrl || undefined,
      dateOfBirth: draft.dateOfBirth || undefined,
      gender: draft.gender || undefined,
      pronouns: draft.pronouns || undefined,
      nationality: draft.nationality || undefined,
      language: draft.language || undefined,
      timezone: draft.timezone || undefined,
    },
    academic: {
      institution: draft.institution || undefined,
      department: draft.department || undefined,
      degree: draft.degree || undefined,
      year: draft.year || undefined,
      studentId: draft.studentId || undefined,
    },
    professional: {
      company: draft.company || undefined,
      role: draft.role || undefined,
      yearsExperience: draft.yearsExperience || undefined,
      industry: draft.industry || undefined,
    },
    research: {
      organization: draft.organization || undefined,
      domain: draft.researchDomain || undefined,
      publications: draft.publications || undefined,
    },
    skills,
    customSkills: draft.customSkills,
    interests: draft.interests,
    portfolio: {
      github: draft.github || undefined,
      linkedin: draft.linkedin || undefined,
      website: draft.website || undefined,
      kaggle: draft.kaggle || undefined,
      devpost: draft.devpost || undefined,
      researchgate: draft.researchgate || undefined,
      resumeName: draft.resumeName || undefined,
      bio: draft.bio || undefined,
    },
  };
}

export function profileToDraft(
  profile: UserProfileData | null | undefined,
  name = "",
): ProfileDraft {
  const base = emptyProfileDraft();
  if (!profile) return { ...base, name };
  return {
    ...base,
    name,
    participantType: profile.participantType ?? "student",
    photoDataUrl: profile.personal?.photoUrl ?? "",
    dateOfBirth: profile.personal?.dateOfBirth ?? "",
    gender: profile.personal?.gender ?? "",
    pronouns: profile.personal?.pronouns ?? "",
    nationality: profile.personal?.nationality ?? "India",
    language: profile.personal?.language ?? "EN",
    timezone: profile.personal?.timezone ?? base.timezone,
    institution: profile.academic?.institution ?? "",
    department: profile.academic?.department ?? "",
    degree: profile.academic?.degree ?? "",
    year: profile.academic?.year ?? "",
    studentId: profile.academic?.studentId ?? "",
    company: profile.professional?.company ?? "",
    role: profile.professional?.role ?? "",
    yearsExperience: profile.professional?.yearsExperience ?? "",
    industry: profile.professional?.industry ?? "",
    organization: profile.research?.organization ?? "",
    researchDomain: profile.research?.domain ?? "",
    publications: profile.research?.publications ?? "",
    skills: {
      ...base.skills,
      ...(profile.skills ?? {}),
    },
    customSkills: profile.customSkills ?? [],
    interests: profile.interests ?? [],
    github: profile.portfolio?.github ?? "",
    linkedin: profile.portfolio?.linkedin ?? "",
    website: profile.portfolio?.website ?? "",
    kaggle: profile.portfolio?.kaggle ?? "",
    devpost: profile.portfolio?.devpost ?? "",
    researchgate: profile.portfolio?.researchgate ?? "",
    resumeName: profile.portfolio?.resumeName ?? "",
    bio: profile.portfolio?.bio ?? "",
  };
}

export function validateStep(step: ProfileStep, draft: ProfileDraft) {
  if (step === "personal") {
    const schema = z.object({
      name: z.string().min(2, "Name is required"),
      nationality: z.string().min(2, "Nationality is required"),
      language: z.string().min(1),
      timezone: z.string().min(1),
    });
    return schema.safeParse(draft);
  }
  if (step === "background") {
    if (draft.participantType === "student") {
      return z
        .object({
          institution: z.string().min(2, "Institution is required"),
          department: z.string().min(2, "Department is required"),
          degree: z.string().min(2, "Degree is required"),
          year: z.string().min(1, "Year / semester is required"),
        })
        .safeParse(draft);
    }
    if (draft.participantType === "professional") {
      return z
        .object({
          company: z.string().min(2, "Company is required"),
          role: z.string().min(2, "Role is required"),
          yearsExperience: z.string().min(1, "Experience is required"),
          industry: z.string().min(2, "Industry is required"),
        })
        .safeParse(draft);
    }
    return z
      .object({
        organization: z.string().min(2, "Organization is required"),
        researchDomain: z.string().min(2, "Research domain is required"),
      })
      .safeParse(draft);
  }
  if (step === "skills") {
    const rated = Object.values(draft.skills).filter(Boolean).length;
    if (rated + draft.customSkills.length < 1) {
      return {
        success: false as const,
        error: { issues: [{ message: "Select at least one skill" }] },
      };
    }
    return { success: true as const, data: draft };
  }
  if (step === "interests") {
    if (draft.interests.length < 1) {
      return {
        success: false as const,
        error: { issues: [{ message: "Pick at least one interest domain" }] },
      };
    }
    return { success: true as const, data: draft };
  }
  return { success: true as const, data: draft };
}

export { INTEREST_DOMAINS, SKILL_CATALOG, SKILL_LEVELS };
