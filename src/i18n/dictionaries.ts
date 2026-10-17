export type Locale = "en" | "id";

export const dictionaries = {
  en: {
    nav: { experience: "Experience", expertise: "Expertise", achievements: "Achievements", certs: "Credentials", contact: "Contact", bgOn: "Turn off the network background", bgOff: "Turn on the network background" },
    hero: {
      greeting: "Samarinda - East Kalimantan, ID",
      role: "IT Network & Systems Engineer",
      intro:
        "Active Informatics student specializing in network systems administration. I build and secure infrastructure: Linux servers, routing, mail, VPN - and the Cisco & MikroTik networks underneath.",
      ctaPrimary: "View experience",
      ctaSecondary: "Get in touch",
      status: "Open to internships & junior roles",
    },
    terminal: { hint: 'type "help" and press enter' },
    cv: {
      label: "Download CV",
      menuLabel: "Choose a language",
      en: "English (US)",
      id: "Bahasa Indonesia",
      pdf: "PDF",
    },
    about: { heading: "Profile", letter: "A note on how I work" },
    experience: { heading: "Where I have worked" },
    education: { heading: "Education" },
    skills: { heading: "Technical expertise" },
    achievements: { heading: "Achievements" },
    certs: { heading: "Certifications", training: "Training" },
    projects: { heading: "Selected work" },
    contact: {
      heading: "Open to internships and network projects.",
      question: "Want to work together?",
      reply: "Samarinda, ID · replies within 1–2 days",
      name: "Your name",
      email: "Email",
      message: "Message",
      send: "Send message",
      sent: "Message received. I will reply within 1–2 days.",
    },
    footer: { rights: "All rights reserved.", built: "Built with Next.js · Prisma · Docker" },
    stats: { competitions: "competition wins & podiums", national: "national rank, LKS 2025", devices: "vendors configured" },
  },
  id: {
    nav: { experience: "Pengalaman", expertise: "Keahlian", achievements: "Prestasi", certs: "Sertifikasi", contact: "Kontak", bgOn: "Matikan latar jaringan", bgOff: "Nyalakan latar jaringan" },
    hero: {
      greeting: "Samarinda - Kalimantan Timur, ID",
      role: "Insinyur Jaringan & Sistem TI",
      intro:
        "Mahasiswa Informatika aktif dengan spesialisasi administrasi sistem jaringan. Saya membangun dan mengamankan infrastruktur: server Linux, routing, mail, VPN - serta jaringan Cisco & MikroTik di bawahnya.",
      ctaPrimary: "Lihat pengalaman",
      ctaSecondary: "Hubungi saya",
      status: "Terbuka untuk magang & peran junior",
    },
    terminal: { hint: 'ketik "help" lalu enter' },
    cv: {
      label: "Unduh CV",
      menuLabel: "Pilih bahasa",
      en: "English (US)",
      id: "Bahasa Indonesia",
      pdf: "PDF",
    },
    about: { heading: "Profil", letter: "Catatan tentang cara saya bekerja" },
    experience: { heading: "Tempat saya bekerja" },
    education: { heading: "Pendidikan" },
    skills: { heading: "Keahlian teknis" },
    achievements: { heading: "Prestasi" },
    certs: { heading: "Sertifikasi", training: "Pelatihan" },
    projects: { heading: "Karya pilihan" },
    contact: {
      heading: "Terbuka untuk magang dan proyek jaringan.",
      question: "Ingin bekerja sama?",
      reply: "Samarinda, ID · balasan dalam 1–2 hari",
      name: "Nama Anda",
      email: "Email",
      message: "Pesan",
      send: "Kirim pesan",
      sent: "Pesan diterima. Saya akan membalas dalam 1–2 hari.",
    },
    footer: { rights: "Hak cipta dilindungi.", built: "Dibangun dengan Next.js · Prisma · Docker" },
    stats: { competitions: "kemenangan & podium kompetisi", national: "peringkat nasional, LKS 2025", devices: "vendor dikonfigurasi" },
  },
} satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dictionaries)["en"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] as Dictionary;
}
