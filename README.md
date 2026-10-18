# nugrah.my.id - Portfolio & Admin CMS

Production-grade portfolio website + dynamic admin CMS for **Anugerah Fakhriza Reswara** - IT Network & Systems Engineer (Samarinda, East Kalimantan).

- Public portfolio: split-stage layout, floating glass navigation, light/dark mode, bilingual EN/ID (auto-detected, manually switchable), interactive terminal, ambient network background, an interactive 3D node constellation in the hero, fluid Framer Motion animations, confetti celebrations on achievement milestones, fully responsive with a mobile hamburger menu.
- Downloadable CVs: redacted PDFs in **English (US)** and **Bahasa Indonesia** served from `public/cv/`, reachable from prominent download buttons in the Hero, Profile and Contact sections. The files can be replaced from the admin panel without code changes.
- Admin CMS at `/admin`: password login (JWT cookie), CRUD for profile, experience, education, certifications/training, achievements, skill groups, projects, a contact-message inbox, and a **file upload library** (PDFs/images stored in the data volume, served at `/files/*`).
- Ordering is **server-managed and drag-and-drop**: no "Order" number to fill in, `order` is `MAX(order) + 1` inside the item's own group (certifications are ordered per category), and reordering a list - or dropping a card into the other Certification group - saves instantly with 3D lift/tilt motion.
- Privacy: the phone number is **never rendered on the public site and never shipped in the public page payload** - contact stays restricted to email and LinkedIn. The phone field exists only in the admin panel.
- Stack: **Next.js 16 (App Router, TypeScript) · React 19 · Tailwind CSS · Framer Motion · @dnd-kit (admin ordering) · canvas-confetti · next-themes · Prisma · SQLite · Docker**.

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

- App serves on port `8039`. Put Nginx/Caddy in front for HTTPS.
- SQLite lives in `./data/portfolio.db` on the host (mounted to `/app/data` in the container - survives rebuilds). Uploaded media lives in `./data/uploads/` (served at `/files/*`). Local dev uses the same `./data/` folder.
- On first boot the entrypoint runs `prisma migrate deploy` and seeds the CV data **only if the DB is empty**. Restarts never wipe admin edits.
- Update later: `docker compose pull` (or rebuild) `&& docker compose up -d`.

### Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | dev only | `file:./data/portfolio.db`. Compose overrides to `file:/app/data/portfolio.db`. |
| `ADMIN_PASSWORD` | yes | Plain text or bcrypt hash (`$2b$…`). Generate: `npx -y bcryptjs-cli` or any bcrypt tool. |
| `JWT_SECRET` | yes | Random string, min 32 chars. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URL for metadata. |
| `UPLOADS_DIR` | no | Overrides the upload directory. Defaults to `<project>/data/uploads`. |

## Admin guide

1. Go to `/admin` - the panel is reachable **by URL only**: nothing on the public site links to it, and the route is `noindex` and disallowed in `robots.txt`. Sign in with `ADMIN_PASSWORD` (7-day session cookie, httpOnly).
2. Tabs: Profile, Experience, Education, Certifications & Training (`category` = `certification` or `training`), Achievements, Skill groups, Projects, **File uploads**, Inbox.
3. **Ordering** is automatic and never typed by hand:
   - A new item is appended to the end of its group (`MAX(order) + 1`). Certification items are ordered inside their own category, so Certifications and Training sort independently.
   - Drag a card by its grip handle to reorder (3D lift, tilt and drop settle), or use the ↑ / ↓ buttons - the keyboard/screen-reader alternative required by WCAG 2.2 "Dragging Movements". Both paths save to the server immediately and show a *Saving / Order saved* chip; a failed save rolls the list back.
   - Drop a card on the other group's panel to move it between **Certifications** and **Training**; its category changes with it.
   - Editing an item keeps its position; switching its category appends it to the end of the destination group. Deleting compacts the group so positions stay a dense 1..n sequence.
   - Positions are unique at the database level (`Certification_category_sortOrder_key`, `Experience_sortOrder_key`, …), so a stale form can never write a duplicate.
4. Profile tab extras: `Phone` is admin-only (never sent to the public page). `Avatar image`, `CV file - English (US)` and `CV file - Bahasa Indonesia` accept an upload directly from the field - the Hero/Profile/Contact download buttons pick the new files up immediately.
5. **File uploads** tab: drop in PDFs or images (12 MB limit). Each file gets a stable URL (`/files/<name>`) with Copy URL / Open / Delete. Uploaded files survive rebuilds because they live in the data volume.
6. List fields (bullets, items, details) accept **one entry per line**; they are stored as JSON arrays and rendered bilingually (EN/ID fields).
7. Contact form on the site saves to Inbox (`Message` table).
8. Sign out clears the session cookie.

Note on achievements: the medal chip and confetti palette are derived from the text you write. `Medallion` → national accent; `1st` / `Juara 1` → gold; `2nd` / `Juara 2` → silver.

## Project structure

```
prisma/
  schema.prisma        # Profile (incl. cvEnUrl / cvIdUrl / avatarUrl), Experience, Education,
                       # Certification, Achievement, SkillGroup, Project, Message
  seed.ts              # Full CV data (EN+ID), idempotent profile upsert
  migrations/          # SQLite migration history
public/
  cv/                  # Redacted CV PDFs: Anugerah_Fakhriza_Reswara_CV_EN.pdf / _ID.pdf
src/
  app/
    page.tsx           # Public portfolio (server component, force-dynamic)
    layout.tsx / providers.tsx / globals.css
    admin/page.tsx     # Admin shell (server auth gate)
    files/[...path]/route.ts      # Serves uploaded media from the data volume
    api/
      contact/route.ts # POST contact form -> Message
      admin/login/route.ts
      admin/upload/route.ts         # Media library: list / upload / delete (auth)
      admin/reorder/route.ts        # Drag-and-drop order (auth): positions + categories in one transaction
      admin/[...resource]/route.ts  # Generic CRUD: GET/POST/PUT/DELETE (order is server-assigned)
  components/          # Navbar (floating glass + mobile menu), HeroNodes (3D field),
                       # CvDownload, Timeline (shared rails), Hero, About, Experience,
                       # Skills, Sections (achievements w/ confetti), Contact, admin,
                       # AdminOrderList (drag-and-drop ordering with 3D motion)
  i18n/                # EN/ID dictionaries + LanguageContext (localStorage, auto-detect)
  lib/                 # db.ts (Prisma), auth.ts (jose JWT), portfolio.ts (public payload,
                       # phone stripped), categories.ts (certification vs training split),
                       # ordering.ts (server-side MAX+1 / compact / reorder),
                       # order-state.ts (pure drop arithmetic), uploads.ts, celebrate.ts,
                       # scroll.ts
data/                  # SQLite DB + uploads (gitignored, volume-mounted)
scripts/
  docker-entrypoint.sh # migrate deploy + seed-if-empty, then exec server
  seed-if-empty.mjs
  order-state.test.ts  # node/tsx tests for the drop arithmetic (npm run test:order)
Dockerfile             # multi-stage, standalone output, non-root user
docker-compose.yml     # single service + ./data volume
```

## Design notes

- Art direction: `split-stage` (dealt via `design-taste-frontend`): hero is a strict 2-column grid - interactive terminal + system status left, profile heading/intro/CTAs/badges right (stacked profile-first on mobile). A full-width crossfading photo band follows the hero; remaining sections flow in a single centered reading column.
- Type: Zilla Slab (display + text), JetBrains Mono for the terminal only (real code context). One button shape (10px), one card radius (14px), page radius (20px).
- Colour: sheet-and-biro - white/black/blue (`#1a4be0`) in light; mapped to near-black/off-white/soft-blue in dark. No gradients, no shadows at rest, no icon-card grids. Content surfaces are separated by a small step in tone (`--surface`), not by lines. Two deliberate, documented exceptions carried as `data-ui` fragments: the floating glass navigation bar (explicit product requirement) and the `/admin` login card. The confetti in Achievements is likewise an explicit requirement (`taste-skill-ignore` comments mark each).
- Rhythm & type: every top-level section shares one vertical rhythm (96px on mobile, 128px on desktop) and one heading scale (`clamp(2rem … 2.9rem)`), so the page reads with an even pulse.
- Ambient field: a fixed `<canvas>` of slowly drifting nodes and links behind the page. It reads colours from the theme tokens, keeps a small node budget with a 2× DPR cap, auto-pauses off screen / hidden tabs, thins then stops itself if the frame budget is blown, and can be switched off from the navbar (remembered in `localStorage`).
- Hero 3D constellation: `HeroNodes` draws a real 3D point-cloud (yaw rotation, pointer parallax, perspective projection) with depth deciding node size/alpha/weight and the cursor pulling light links from nearby nodes. Same performance philosophy as the ambient field; one static frame under `prefers-reduced-motion`. (three.js/R3F were evaluated and skipped: ~150KB gzip for a decorative points-and-links scene does not pay for itself here.)
- Timelines: Experience, Education and Certifications share one scroll-linked progress rail (`Timeline.tsx`); the rail is measured from first to last node centre and its glowing fill is pinned to a viewport reading line, so it meets each dot exactly as the dot lights.
- Admin ordering (`AdminOrderList.tsx`, `@dnd-kit` + Framer Motion): cards are a double-bezel plate (machined outer tray, content on its own inner plate) with a spring-animated position chip. While dragging, the card lifts off the page - a scale spring, a tilt driven by the drag vector through motion values (`rotateX`/`rotateY` on the compositor, no re-render per pointer event) and a deeper shadow - and settles back with a spring drop; the original row stays behind as a dashed placeholder. Motion values only, no layout properties animated, and everything collapses to a still list under `prefers-reduced-motion`. Required by the product spec as a `data-ui` fragment.
- Achievements: 3D tilt with a faint pointer-tracking light sheen (depth reaction), medal chips derived from the result text (gold / silver / national), a small confetti sparkle on first hover of each card and a full burst on click or Enter - all no-ops under `prefers-reduced-motion` (canvas-confetti is imported on demand, never in the initial bundle).
- Mobile: floating bar collapses into a hamburger + animated glass panel (44px rows, CV shortcuts, toggles) under 1024px; `viewport-fit=cover` + `env(safe-area-inset-top)` keep the bar clear of the notch; tap highlight removed; 16px inputs; `touch-action: manipulation` on controls; theme-color per scheme.
- Privacy: `getPortfolioData()` builds an explicit public profile projection in `src/lib/portfolio.ts` - the phone number is not part of it and therefore never appears in the HTML/RSC payload. Contact = email + LinkedIn only.
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
| `npm run test:order` | Unit tests for the drag-and-drop drop arithmetic |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
