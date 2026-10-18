import { db, parseJsonArray } from "./db";
import { normalizeCategory } from "./categories";

export type PortfolioData = Awaited<ReturnType<typeof getPortfolioData>>;

// The public profile shape, deliberately narrower than the Prisma row: the
// phone number never leaves the server (admin-only field), per the site's
// privacy policy. Contact stays restricted to email + LinkedIn.
export type PublicProfile = {
  name: string;
  titleEn: string;
  titleId: string;
  summaryEn: string;
  summaryId: string;
  email: string;
  location: string;
  linkedin: string;
  portfolioUrl: string;
  github: string;
  cvEnUrl: string;
  cvIdUrl: string;
  avatarUrl: string;
};

const FALLBACK_PROFILE: PublicProfile = {
  name: "Anugerah Fakhriza Reswara",
  titleEn: "IT Network & Systems Engineer",
  titleId: "Insinyur Jaringan & Sistem TI",
  summaryEn: "",
  summaryId: "",
  email: "nugrahreswara@gmail.com",
  location: "Samarinda, East Kalimantan",
  linkedin: "https://linkedin.com/in/nugrahreswara",
  portfolioUrl: "https://nugrah.my.id",
  github: "",
  cvEnUrl: "/cv/Anugerah_Fakhriza_Reswara_CV_EN.pdf",
  cvIdUrl: "/cv/Anugerah_Fakhriza_Reswara_CV_ID.pdf",
  avatarUrl: "",
};

export async function getPortfolioData() {
  const [profile, experiences, educations, certifications, achievements, skillGroups, projects] =
    await Promise.all([
      db.profile.findUnique({ where: { id: 1 } }),
      db.experience.findMany({ orderBy: { sortOrder: "asc" } }),
      db.education.findMany({ orderBy: { sortOrder: "asc" } }),
      db.certification.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
      db.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
      db.skillGroup.findMany({ orderBy: { sortOrder: "asc" } }),
      db.project.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  const publicProfile: PublicProfile = profile
    ? {
        name: profile.name,
        titleEn: profile.titleEn,
        titleId: profile.titleId,
        summaryEn: profile.summaryEn,
        summaryId: profile.summaryId,
        email: profile.email,
        location: profile.location,
        linkedin: profile.linkedin,
        portfolioUrl: profile.portfolioUrl,
        github: profile.github,
        cvEnUrl: profile.cvEnUrl || FALLBACK_PROFILE.cvEnUrl,
        cvIdUrl: profile.cvIdUrl || FALLBACK_PROFILE.cvIdUrl,
        avatarUrl: profile.avatarUrl,
      }
    : FALLBACK_PROFILE;

  return {
    profile: publicProfile,
    experiences: experiences.map((e) => ({
      ...e,
      bulletsEn: parseJsonArray(e.bulletsEn),
      bulletsId: parseJsonArray(e.bulletsId),
    })),
    educations,
    // Strict split for the two public sections. `normalizeCategory` collapses
    // blank/unknown values (rows saved before the fix) to "certification", so a
    // certification can never leak into the Training list again.
    certifications: certifications.filter((c) => normalizeCategory(c.category) === "certification"),
    trainings: certifications.filter((c) => normalizeCategory(c.category) === "training"),
    achievements: achievements.map((a) => ({
      ...a,
      descriptionEn: parseJsonArray(a.descriptionEn),
      descriptionId: parseJsonArray(a.descriptionId),
    })),
    skillGroups: skillGroups.map((g) => ({
      ...g,
      itemsEn: parseJsonArray(g.itemsEn),
      itemsId: parseJsonArray(g.itemsId),
    })),
    projects,
  };
}
