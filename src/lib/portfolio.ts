import { db, parseJsonArray } from "./db";

export type PortfolioData = Awaited<ReturnType<typeof getPortfolioData>>;

export async function getPortfolioData() {
  const [profile, experiences, educations, certifications, achievements, skillGroups, projects] =
    await Promise.all([
      db.profile.findUnique({ where: { id: 1 } }),
      db.experience.findMany({ orderBy: { sortOrder: "asc" } }),
      db.education.findMany({ orderBy: { sortOrder: "asc" } }),
      db.certification.findMany({ orderBy: { sortOrder: "asc" } }),
      db.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
      db.skillGroup.findMany({ orderBy: { sortOrder: "asc" } }),
      db.project.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  return {
    profile: profile ?? {
      name: "Anugerah Fakhriza Reswara",
      titleEn: "IT Network & Systems Engineer",
      titleId: "Insinyur Jaringan & Sistem TI",
      summaryEn: "",
      summaryId: "",
      email: "nugrahreswara@gmail.com",
      phone: "+62 856-5477-2530",
      location: "Samarinda, East Kalimantan",
      linkedin: "https://linkedin.com/in/nugrahreswara",
      portfolioUrl: "https://nugrah.my.id",
      github: "",
    },
    experiences: experiences.map((e) => ({
      ...e,
      bulletsEn: parseJsonArray(e.bulletsEn),
      bulletsId: parseJsonArray(e.bulletsId),
    })),
    educations,
    certifications,
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
