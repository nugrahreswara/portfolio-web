# nugrah.my.id - Portfolio & Admin CMS

Production-grade portfolio website + dynamic admin CMS for **Anugerah Fakhriza Reswara** - IT Network & Systems Engineer (Samarinda, East Kalimantan).

- Public portfolio: split-stage layout, light/dark mode, bilingual EN/ID, interactive terminal, ambient network background, fluid Framer Motion animations, fully responsive.
- Admin CMS at `/admin`: password login (JWT cookie), CRUD for profile, experience, education, certifications/training, achievements, skill groups, projects, plus contact-message inbox. No code edits needed.
- Stack: **Next.js 14 (App Router, TypeScript) · Tailwind CSS · Framer Motion · next-themes · Prisma · SQLite · Docker**.

## Quick start (local dev)

Requirements: Node 20+, npm.

```powershell
Copy-Item .env.example .env
# edit .env -> set ADMIN_PASSWORD and JWT_SECRET
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

Open http://localhost:3000 · Admin at http://localhost:3000/admin.

## Production deploy (self-hosted, Docker)

Requirements: Docker + Docker Compose on your Linux/Windows server.

```powershell
Copy-Item .env.example .env
# edit .env for production:
#   ADMIN_PASSWORD=<strong password>   (or bcrypt hash $2b$...)
#   JWT_SECRET=<long random string, min 32 chars>
#   NEXT_PUBLIC_SITE_URL=https://nugrah.my.id
docker compose up -d --build
docker compose logs -f portfolio
```

- App serves on port `3000`. Put Nginx/Caddy in front for HTTPS.
- SQLite lives in `./data/portfolio.db` on the host (mounted to `/app/data` in the container - survives rebuilds). Local dev without Docker uses `prisma/data/portfolio.db`.
- On first boot the entrypoint runs `prisma migrate deploy` and seeds the CV data **only if the DB is empty**. Restarts never wipe admin edits.
- Update later: `docker compose pull` (or rebuild) `&& docker compose up -d`.

### Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | dev only | `file:./data/portfolio.db`. Compose overrides to `file:/app/data/portfolio.db`. |
| `ADMIN_PASSWORD` | yes | Plain text or bcrypt hash (`$2b$…`). Generate: `npx -y bcryptjs-cli` or any bcrypt tool. |
| `JWT_SECRET` | yes | Random string, min 32 chars. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL for metadata. |

## Admin guide

1. Go to `/admin` - the panel is reachable **by URL only**: nothing on the public site links to it, and the route is `noindex` and disallowed in `robots.txt`. Sign in with `ADMIN_PASSWORD` (7-day session cookie, httpOnly).
2. Tabs: Profile, Experience, Education, Certifications & Training (`category` = `certification` or `training`), Achievements, Skill groups, Projects, Inbox.
3. List fields (bullets, items, details) accept **one entry per line**; they are stored as JSON arrays and rendered bilingually (EN/ID fields).
4. Contact form on the site saves to Inbox (`Message` table).
5. Sign out clears the session cookie.

## Project structure

```
prisma/
  schema.prisma        # Profile, Experience, Education, Certification, Achievement, SkillGroup, Project, Message
  seed.ts              # Full CV data (EN+ID), idempotent profile upsert
  migrations/          # SQLite migration history
src/
  app/
    page.tsx           # Public portfolio (server component, force-dynamic)
    layout.tsx / providers.tsx / globals.css
    admin/page.tsx     # Admin shell (server auth gate)
    api/
      contact/route.ts # POST contact form -> Message
      admin/login/route.ts
      admin/[...resource]/route.ts  # Generic CRUD: GET/POST/PUT/DELETE
  components/          # Navbar, StagePanel, Terminal, NodeField, Hero, About, Experience, Skills, Sections, Contact, admin
  i18n/                # EN/ID dictionaries + LanguageContext (localStorage, auto-detect)
  lib/                 # db.ts (Prisma), auth.ts (jose JWT), portfolio.ts
scripts/
  docker-entrypoint.sh # migrate deploy + seed-if-empty, then exec server
  seed-if-empty.mjs
Dockerfile             # multi-stage, standalone output, non-root user
docker-compose.yml     # single service + ./data volume
```

## Design notes

- Art direction: `split-stage` (dealt via `design-taste-frontend`): hero is a strict 2-column grid - interactive terminal + system status left, profile heading/intro/CTAs/badges right (stacked profile-first on mobile). A full-width crossfading photo band follows the hero; remaining sections flow in a single centered reading column.
- Type: Zilla Slab (display + text), JetBrains Mono for the terminal only (real code context). One button shape (10px), one card radius (14px), page radius (20px).
- Colour: sheet-and-biro - white/black/blue (`#1a4be0`) in light; mapped to near-black/off-white/soft-blue in dark. No gradients, no shadows at rest, no glass, no icon-card grids. Content surfaces are separated by a small step in tone (`--surface`), not by lines; hairlines are reserved for the terminal, form fields and buttons. The single exception is the `/admin` login card, an interface fragment marked `data-ui` that keeps its own hairline, blur and depth because it sits over the live field rather than on paper.
- Rhythm & type: every top-level section shares one vertical rhythm (96px on mobile, 128px on desktop) and one heading scale (`clamp(2rem … 2.9rem)`), so the page reads with an even pulse rather than drifting margins.
- Ambient field: a fixed `<canvas>` of slowly drifting nodes and 1.5px links behind the page - a quiet network topology, the subject's own world. Link strokes stay legible on hidpi panels (weight plus a lifted mid-range falloff, ~0.30 alpha in light, ~0.40 in dark, tighter reach under 640px) while dots keep the accent colour. It reads its colours from the theme tokens (`--accent`, `--muted`) so it recolours on light/dark switch without re-seeding, keeps a small fixed node budget with a 2× DPR cap, and avoids shadows and gradients so it stays cheap. It auto-pauses when the tab is hidden, draws a single static frame under `prefers-reduced-motion`, thins then stops itself if the frame budget is blown, and can be switched off entirely from the navbar (remembered in `localStorage`).
- Overflow discipline: nothing on the page is wider than the viewport even with every clip removed - entrance slides stay inside their gutter (rows rise from the rail side at `x: -16`, credit rows at `x: -10`), the magnetic pull is clamped to ±12/±10px, and three fences (`html`, `body`, `main`, all `overflow-x: clip` with a `hidden` fallback on the root) make a horizontal pan impossible without creating a scroll container, so the sticky navbar and the fixed modal keep the viewport as their reference.
- Idea: the network itself is the fixed stage - `nugrah@edge` terminal + uptime strip stays present while the CV scrolls past.
- Live thing: interactive terminal (`help`, `whoami`, `experience`, `skills`, `certs`, `contact`, `clear`), bilingual, thumb-usable, with `<noscript>` fallback.
- Admin surface: the sign-in screen is one `data-ui` glass card, exactly centred (`min-h-[100svh]`, `items-center`) with the node field flowing behind it; the back link floats top-left so it never pulls the card off-centre. The field and button carry their own focus/invalid rings, the error line grows in once, shakes, and announces itself (`role="alert"`, `aria-invalid`), and submit turns into a spinner instead of a washed-out disabled button.
- Motion: Lenis inertial smooth scrolling (auto-disabled on reduced motion), a glowing timeline rail whose track is measured from the first node centre to the last and whose fill tip is pinned to a viewport reading line, so it reaches each dot exactly as that dot lights; staggered entrances, magnetic hover on CTAs/chips/stats, 3D tilt + detail modals on achievements, parallax photo band + footer, locale-crossfade text, animated theme icon and admin tab indicator. Transform/opacity only, springs for gestures, `prefers-reduced-motion` respected throughout.
- Photos (Unsplash via picsum.photos, credited in footer): `id/1081` Julien Moreau, `id/618` Mika Ruusunen, `id/887` Roman Kraft, `id/508` Jeff Sheldon.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Prisma client + production build (migrations run at container startup; run `db:migrate` locally) |
| `npm run start` | Serve production build |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed CV data (`tsx prisma/seed.ts`) |
| `npm run db:studio` | Prisma Studio data browser |
