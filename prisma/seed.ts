import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.profile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Anugerah Fakhriza Reswara",
      titleEn: "IT Network & Systems Engineer",
      titleId: "Insinyur Jaringan & Sistem TI",
      summaryEn:
        "Active Informatics student specializing in IT Network Systems Administration, Network Engineering and IT Support. Hands-on experience in IT infrastructure deployment, Linux/Windows server configuration, and Cisco & MikroTik device management. Collaborative team worker with high sense of responsibility.",
      summaryId:
        "Mahasiswa Informatika aktif dengan spesialisasi Administrasi Sistem Jaringan TI, Network Engineer, dan IT Support. Berpengalaman praktis dalam instalasi infrastruktur TI, konfigurasi server Linux/Windows, serta manajemen dan konfigurasi perangkat Cisco dan MikroTik. Terbiasa bekerja kolaboratif dalam tim dengan tanggung jawab tinggi.",
      email: "nugrahreswara@gmail.com",
      phone: "+62 856-5477-2530",
      location: "Samarinda, East Kalimantan",
      linkedin: "https://linkedin.com/in/nugrahreswara",
      portfolioUrl: "https://nugrah.my.id",
      github: "",
      cvEnUrl: "/cv/Anugerah_Fakhriza_Reswara_CV_EN.pdf",
      cvIdUrl: "/cv/Anugerah_Fakhriza_Reswara_CV_ID.pdf",
      avatarUrl: "",
    },
  });

  await db.experience.deleteMany();
  const experiences = [
    {
      company: "ICT Mulawarman University",
      roleEn: "Infrastructure, Network, and Security Division Intern",
      roleId: "Magang Divisi Infrastruktur, Jaringan, dan Keamanan",
      location: "Samarinda",
      period: "Aug 2026 - Present",
      startDate: "2026-08",
      endDate: "",
      current: true,
      bulletsEn: [
        "Engineered and deployed an enterprise-grade perimeter gateway with OPNsense on VMware ESXi - public IP routing, firewall rules, and WireGuard VPN remote access.",
        "Architected a multi-tenant web hosting platform on Debian GNU/Linux, orchestrating dozens of isolated student containers with Docker and NGINX reverse proxy.",
        "Implemented mail infrastructure (Postfix + Dovecot) with SPF, DKIM and DMARC for internal institutional communication.",
        "Administered multi-service game server workloads on Linux: JVM tuning, UFW management, cross-platform network optimization (GeyserMC/ViaVersion).",
        "Conducted internal vulnerability assessments and pentest simulations (e.g. CVE-2021-21974 / OpenSLP) with formal audit reports for IT leadership.",
      ],
      bulletsId: [
        "Merancang dan menerapkan perimeter gateway kelas enterprise dengan OPNsense di atas VMware ESXi - routing IP publik, aturan firewall, dan akses jarak jauh via VPN WireGuard.",
        "Membangun platform web hosting multi-tenant di Debian GNU/Linux, mengorkestrasi puluhan kontainer aplikasi mahasiswa dengan Docker dan NGINX reverse proxy.",
        "Mengimplementasikan infrastruktur email (Postfix + Dovecot) dengan SPF, DKIM, dan DMARC untuk komunikasi internal institusi.",
        "Mengelola beban kerja game server multi-layanan di Linux: tuning JVM, manajemen UFW, optimasi jaringan lintas platform (GeyserMC/ViaVersion).",
        "Melakukan asesmen kerentanan jaringan internal dan simulasi penetration testing (mis. CVE-2021-21974 / OpenSLP) beserta laporan audit mitigasi.",
      ],
      sortOrder: 1,
    },
    {
      company: "PT. PLN Icon Plus",
      roleEn: "On-site Retail & Customer Service",
      roleId: "Retail On-site & Layanan Pelanggan",
      location: "Samarinda",
      period: "Jul 2024 - Dec 2024",
      startDate: "2024-07",
      endDate: "2024-12",
      current: false,
      bulletsEn: [
        "Managed customer modem asset inventory and post-subscription coordination.",
        "Repaired physical cable infrastructure in areas hit by mass network disruption.",
        "Mapped cable paths virtually through internal systems to improve distribution efficiency.",
      ],
      bulletsId: [
        "Mengelola aset perangkat modem pelanggan dan koordinasi pasca-berlangganan.",
        "Memperbaiki infrastruktur kabel fisik di area terdampak gangguan jaringan massal.",
        "Memetakan jalur kabel secara virtual melalui sistem internal untuk efisiensi distribusi.",
      ],
      sortOrder: 2,
    },
    {
      company: "Bank Sinarmas",
      roleEn: "IT Support",
      roleId: "IT Support",
      location: "Samarinda",
      period: "Apr 2024 - Aug 2024",
      startDate: "2024-04",
      endDate: "2024-08",
      current: false,
      bulletsEn: [
        "Rejuvenated infrastructure by installing and configuring computers, laptops and printers to Bank Sinarmas operational standards.",
        "Managed local network connectivity for secure, stable access to central servers.",
        "Provided peripheral troubleshooting to keep daily office operations running smoothly.",
      ],
      bulletsId: [
        "Meremajakan infrastruktur dengan instalasi dan konfigurasi komputer, laptop, dan printer sesuai standar operasional Bank Sinarmas.",
        "Mengelola konektivitas jaringan lokal untuk akses yang aman dan stabil ke server pusat.",
        "Memberikan dukungan teknis periferal (troubleshooting) agar operasional kantor berjalan lancar.",
      ],
      sortOrder: 3,
    },
  ];
  for (const e of experiences) {
    await db.experience.create({
      data: {
        ...e,
        bulletsEn: JSON.stringify(e.bulletsEn),
        bulletsId: JSON.stringify(e.bulletsId),
      },
    });
  }

  await db.education.deleteMany();
  await db.education.createMany({
    data: [
      {
        school: "Mulawarman University",
        degreeEn: "B.Sc. Computer Science (Informatics)",
        degreeId: "S1 Ilmu Komputer (Informatika)",
        field: "Informatics",
        period: "2025 - Present",
        current: true,
        sortOrder: 1,
      },
      {
        school: "SMKS TI Airlangga Samarinda",
        degreeEn: "Computer Network & Telecommunications Engineering",
        degreeId: "Teknik Komputer Jaringan & Telekomunikasi",
        field: "TKJ",
        period: "2022 - 2025",
        current: false,
        sortOrder: 2,
      },
    ],
  });

  await db.certification.deleteMany();
  const certs = [
    { titleEn: "MikroTik Certified Network Associate (MTCNA)", titleId: "MikroTik Certified Network Associate (MTCNA)", issuer: "MikroTik", issuerDetail: "2024", period: "Jun 2024 - 2027", category: "certification", sortOrder: 1 },
    { titleEn: "Junior Technical Support", titleId: "Junior Technical Support", issuer: "BNSP - National Professional Certification Agency", issuerDetail: "2025", period: "May 2025 - 2028", category: "certification", sortOrder: 2 },
    { titleEn: "Omada Certified Network Administrator - Routing & Switching", titleId: "Omada Certified Network Administrator - Routing & Switching", issuer: "Omada TP-Link", issuerDetail: "2025", period: "May 2025 - 2028", category: "certification", sortOrder: 3 },
    { titleEn: "Omada Certified Network Administrator - Wireless", titleId: "Omada Certified Network Administrator - Wireless", issuer: "Omada TP-Link", issuerDetail: "2025", period: "May 2025 - 2028", category: "certification", sortOrder: 4 },
    { titleEn: "Proxmox-based Virtual Server Management Training", titleId: "Pelatihan Manajemen Server Virtual berbasis Proxmox", issuer: "Samarinda State Polytechnic", issuerDetail: "", period: "Jun 19, 2024", category: "training", sortOrder: 5 },
    { titleEn: "Getting Started with Linux Fundamentals (RH104 RHA) v9.1", titleId: "Dasar Linux Fundamentals (RH104 RHA) v9.1", issuer: "Red Hat Academy", issuerDetail: "", period: "Nov 20, 2025", category: "training", sortOrder: 6 },
    { titleEn: "Red Hat System Administration I (RH124 RHA) v10", titleId: "Administrasi Sistem Red Hat I (RH124 RHA) v10", issuer: "Red Hat Academy", issuerDetail: "", period: "Jun 6, 2026", category: "training", sortOrder: 7 },
    { titleEn: "Red Hat System Administration II (RH134 RHA) v10", titleId: "Administrasi Sistem Red Hat II (RH134 RHA) v10", issuer: "Red Hat Academy", issuerDetail: "", period: "Aug 2, 2026", category: "training", sortOrder: 8 },
    { titleEn: "RHEL Automation with Ansible (RH294 RHA) v9.0", titleId: "Otomasi RHEL dengan Ansible (RH294 RHA) v9.0", issuer: "Red Hat Academy", issuerDetail: "", period: "Sep 20, 2026", category: "training", sortOrder: 9 },
  ];
  for (const c of certs) await db.certification.create({ data: c });

  await db.achievement.deleteMany();
  const achievements = [
    {
      titleEn: "Medallion for Excellence - IT Network Systems Administration",
      titleId: "Medallion for Excellence - Administrasi Sistem Jaringan TI",
      event: "National Student Competency Competition (LKS Nasional 2025)",
      result: "Rank 10th of 30 provincial representatives · Score 700+",
      period: "Jul 28 - Aug 1, 2025",
      descriptionEn: ["National-level Linux/Windows server stack: firewall, DNS, DHCP, web (HTTP/HTTPS), mail (SMTP/POP3/IMAP), webmail, VPN.", "Cisco routing & switching: dynamic routing, VLAN, inter-VLAN, ACL, port security, EtherChannel, VTP, DHCP, DNS."],
      descriptionId: ["Tumpukan server Linux/Windows tingkat nasional: firewall, DNS, DHCP, web, mail, webmail, VPN.", "Routing & switching Cisco: dynamic routing, VLAN, inter-VLAN, ACL, port security, EtherChannel, VTP, DHCP, DNS."],
      sortOrder: 1,
    },
    {
      titleEn: "1st Place - IT Network Systems Administration",
      titleId: "Juara 1 - Administrasi Sistem Jaringan TI",
      event: "East Kalimantan Provincial LKS",
      result: "1st of 8 regency/city representatives",
      period: "Jul 19 - 21, 2025",
      descriptionEn: ["Full server + Cisco stack deployment under competition time pressure."],
      descriptionId: ["Implementasi penuh server + Cisco di bawah tekanan waktu kompetisi."],
      sortOrder: 2,
    },
    {
      titleEn: "1st Place - IT Network Systems Administration",
      titleId: "Juara 1 - Administrasi Sistem Jaringan TI",
      event: "Samarinda City LKS",
      result: "1st of 9 vocational schools",
      period: "Apr 29, 2025",
      descriptionEn: ["Linux/Windows services: firewall, DNS, DHCP, web, mail, webmail."],
      descriptionId: ["Layanan Linux/Windows: firewall, DNS, DHCP, web, mail, webmail."],
      sortOrder: 3,
    },
    {
      titleEn: "1st Place - Computer Network Competition",
      titleId: "Juara 1 - Kompetisi Jaringan Komputer",
      event: "TECHNOFEST Mulia University Balikpapan",
      result: "1st of 19 participants",
      period: "Feb 4, 2025",
      descriptionEn: ["Cisco + MikroTik: dynamic routing, VLAN, inter-VLAN, port security, DHCP, L2TP VPN."],
      descriptionId: ["Cisco + MikroTik: dynamic routing, VLAN, inter-VLAN, port security, DHCP, L2TP VPN."],
      sortOrder: 4,
    },
    {
      titleEn: "2nd Place - IT Network Systems Administration",
      titleId: "Juara 2 - Administrasi Sistem Jaringan TI",
      event: "East Kalimantan Provincial LKS",
      result: "2nd of 7 regency/city representatives",
      period: "Jul 12 - 14, 2024",
      descriptionEn: ["Full server + Cisco stack deployment."],
      descriptionId: ["Implementasi penuh server + Cisco."],
      sortOrder: 5,
    },
    {
      titleEn: "1st Place - IT Network Systems Administration",
      titleId: "Juara 1 - Administrasi Sistem Jaringan TI",
      event: "Samarinda City LKS",
      result: "1st of 7 vocational schools",
      period: "May 4, 2024",
      descriptionEn: ["Linux/Windows services: firewall, DNS, DHCP, web, mail, webmail."],
      descriptionId: ["Layanan Linux/Windows: firewall, DNS, DHCP, web, mail, webmail."],
      sortOrder: 6,
    },
  ];
  for (const a of achievements) {
    await db.achievement.create({
      data: { ...a, descriptionEn: JSON.stringify(a.descriptionEn), descriptionId: JSON.stringify(a.descriptionId) },
    });
  }

  await db.skillGroup.deleteMany();
  const groups = [
    {
      titleEn: "IT Systems Administration",
      titleId: "Administrasi Sistem TI",
      itemsEn: ["Linux / FreeBSD / Windows Server & Client install & config", "Routing, NAT, DNS, Apache2/NGINX, Mail, WebMail, LDAP, DHCP, SSL/TLS", "NFTables/IPTables firewall, HAProxy/Squid proxy, VPN server/client", "Ansible automation, Keepalived, Proxmox, VMware ESXi, Docker"],
      itemsId: ["Instalasi & konfigurasi Linux / FreeBSD / Windows Server & Client", "Routing, NAT, DNS, Apache2/NGINX, Mail, WebMail, LDAP, DHCP, SSL/TLS", "Firewall NFTables/IPTables, proxy HAProxy/Squid, VPN server/client", "Otomasi Ansible, Keepalived, Proxmox, VMware ESXi, Docker"],
      sortOrder: 1,
    },
    {
      titleEn: "IT Network Administration",
      titleId: "Administrasi Jaringan TI",
      itemsEn: ["Cisco AP/Router/Switch, MikroTik, Ruijie, Ubiquiti, TP-Link", "RIP / OSPF / EIGRP / HSRP, VLAN, STP, EtherChannel, VTP", "Firewall, ACL, port security", "DHCP, DNS, TFTP, hotspot services"],
      itemsId: ["Cisco AP/Router/Switch, MikroTik, Ruijie, Ubiquiti, TP-Link", "RIP / OSPF / EIGRP / HSRP, VLAN, STP, EtherChannel, VTP", "Firewall, ACL, port security", "Layanan DHCP, DNS, TFTP, hotspot"],
      sortOrder: 2,
    },
    {
      titleEn: "Internet of Things",
      titleId: "Internet of Things",
      itemsEn: ["Arduino Uno / Mega / Nano, ESP32, ESP8266", "Raspberry Pi 3 & 4"],
      itemsId: ["Arduino Uno / Mega / Nano, ESP32, ESP8266", "Raspberry Pi 3 & 4"],
      sortOrder: 3,
    },
  ];
  for (const g of groups) {
    await db.skillGroup.create({
      data: { ...g, itemsEn: JSON.stringify(g.itemsEn), itemsId: JSON.stringify(g.itemsId) },
    });
  }

  await db.project.deleteMany();
  const projects = [
    {
      titleEn: "Enterprise Perimeter Gateway - OPNsense on ESXi",
      titleId: "Perimeter Gateway Enterprise - OPNsense di ESXi",
      descriptionEn: "Public IP routing, firewall policy and WireGuard VPN tunnels serving campus infrastructure at ICT Mulawarman.",
      descriptionId: "Routing IP publik, kebijakan firewall, dan terowongan VPN WireGuard untuk infrastruktur kampus di ICT Mulawarman.",
      tech: "OPNsense, VMware ESXi, WireGuard",
      url: "",
      repo: "",
      featured: true,
      sortOrder: 1,
    },
    {
      titleEn: "Multi-tenant Student Hosting Platform",
      titleId: "Platform Hosting Mahasiswa Multi-tenant",
      descriptionEn: "Dozens of isolated Docker containers behind NGINX reverse proxy on Debian hosts.",
      descriptionId: "Puluhan kontainer Docker terisolasi di balik NGINX reverse proxy pada host Debian.",
      tech: "Debian, Docker, NGINX",
      url: "",
      repo: "",
      featured: true,
      sortOrder: 2,
    },
    {
      titleEn: "Campus Mail Infrastructure",
      titleId: "Infrastruktur Email Kampus",
      descriptionEn: "Postfix + Dovecot with SPF, DKIM and DMARC hardening for institutional mail.",
      descriptionId: "Postfix + Dovecot dengan penguatan SPF, DKIM, dan DMARC untuk email institusi.",
      tech: "Postfix, Dovecot, DNS",
      url: "",
      repo: "",
      featured: true,
      sortOrder: 3,
    },
    {
      titleEn: "LKS Competition Network Lab",
      titleId: "Lab Jaringan Kompetisi LKS",
      descriptionEn: "Reproducible Cisco + Linux/Windows service topologies from national competition tasks.",
      descriptionId: "Topologi layanan Cisco + Linux/Windows yang dapat direproduksi dari soal kompetisi nasional.",
      tech: "Cisco, Debian, Windows Server",
      url: "",
      repo: "",
      featured: false,
      sortOrder: 4,
    },
  ];
  for (const p of projects) await db.project.create({ data: p });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
