# The Matrix Today Portal

Official publication website of the College of Engineering, Marinduque State
University. **One Next.js project** containing the public reader site, the
sign-in page, and the shared editorial dashboard used by both Editors and the
Administrator (Editor-in-Chief).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with the TMT brand palette
- **Prisma → MySQL** (schema in `prisma/schema.prisma`, client + queries
  stubbed out in `src/server/`)
- **Auth.js (NextAuth v5)** — placeholder wired in `src/server/auth.ts`
- **Inter** (self-hosted via `next/font/google`)
- Deployed to **Vercel** + **GitHub** for version control

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env template. You don't need a real DATABASE_URL yet — the
#    repositories return seed data until Prisma is wired up.
cp .env.example .env.local

# 3. Run
npm run dev
```

Then open <http://localhost:3000>.

**Not sure where to start?** Open <http://localhost:3000/dev> — an index of
every route in the app, one click each. That page 404s automatically in
production.

### Set up the database

```bash
# 1. Create the database in MySQL
#    CREATE DATABASE tmt_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Point .env at it, and set AUTH_SECRET
cp .env.example .env
#    openssl rand -base64 32   → paste into AUTH_SECRET

# 3. Create the tables and load starter data
npm run db:generate
npm run db:migrate
npm run db:seed
```

`npm run db:seed` is **idempotent** — safe to re-run, upserts on natural keys,
never duplicates rows. It loads website settings, 6 categories, an
Administrator and an Editor account, 23 editorial board members, and 8 sample
articles.

### Sign in

Credentials come from the `SEED_*` variables in your `.env`:

| Role          | Default email          | Password       |
| ------------- | ---------------------- | -------------- |
| Administrator | `eic@marsu.edu.ph`     | `ChangeMe!123` |
| Editor        | `editor@marsu.edu.ph`  | `ChangeMe!123` |

**Change these before deploying anywhere.** To rotate a password, edit the
value in `.env` and re-run `npm run db:seed` — it re-hashes on every run.

Sign in at <http://localhost:3000/login>. Both roles land on `/dashboard`; the
sidebar and every API route gate on the role stored in the database.

> The Administrator/Editor toggle on the login form is a UI affordance only.
> The real role comes from the `users` table — the client's selection is never
> trusted, since doing so would be a privilege-escalation hole.

### Optional: skip login during frontend work

Set `DEV_PREVIEW_ROLE="admin"` (or `"editor"`) in `.env` to view the dashboard
without signing in. Ignored entirely when `NODE_ENV=production`. Now that real
auth works this is optional — leave it unset to exercise the actual flow.

## URL map (aka "where each screen lives")

The whole point of an App Router project is that folder = URL. If a route
feels missing, check the folder; if a folder looks orphaned, check the URL.

| URL                              | File                                                      | Notes                            |
| -------------------------------- | --------------------------------------------------------- | -------------------------------- |
| **Public site** — no auth        |                                                           |                                  |
| `/`                              | `src/app/(public)/page.tsx`                               | Homepage                         |
| `/news`, `/features`, etc.       | `src/app/(public)/<category>/page.tsx`                    | Six category pages               |
| `/articles/[slug]`               | `src/app/(public)/articles/[slug]/page.tsx`               | Article detail                   |
| `/bookmarks`                     | `src/app/(public)/bookmarks/page.tsx`                     | localStorage-backed              |
| `/search?q=…`                    | `src/app/(public)/search/page.tsx`                        |                                  |
| `/about`, `/editor-in-chief`, `/terms` | `src/app/(public)/…/page.tsx`                       | Static pages                     |
| **Auth**                         |                                                           |                                  |
| `/login`                         | `src/app/(auth)/login/page.tsx` → `components/auth/LoginForm.tsx` | Administrator / Editor selector  |
| **Dashboard** — auth required    |                                                           |                                  |
| `/dashboard`                     | `src/app/dashboard/page.tsx`                              | Dashboard home                   |
| `/dashboard/articles`            | `src/app/dashboard/articles/…`                            | Article CRUD                     |
| `/dashboard/drafts`              |                                                           |                                  |
| `/dashboard/categories`          |                                                           | Editor + admin                   |
| `/dashboard/board`               |                                                           | Editorial board management       |
| `/dashboard/media`               |                                                           | Media library                    |
| `/dashboard/feedback`            |                                                           | Feedback inbox                   |
| `/dashboard/profile`             |                                                           |                                  |
| `/dashboard/analytics`           |                                                           | **admin-only**                   |
| `/dashboard/users`               |                                                           | **admin-only**                   |
| `/dashboard/activity-logs`       |                                                           | **admin-only**                   |
| `/dashboard/settings`            |                                                           | **admin-only**                   |
| **API**                          |                                                           |                                  |
| `/api/articles`, `/api/categories`, etc. | `src/app/api/…/route.ts`                          | All Zod-validated, permission-checked |
| **Developer**                    |                                                           |                                  |
| `/dev`                           | `src/app/dev/page.tsx`                                    | Route index. **404s in production.** |

**Editor vs Administrator dashboard.** One shared codebase, role-gated. The
sidebar filters `adminOnly` items when the signed-in user's role isn't
`admin`; every admin-only API route independently checks `isAdmin` server-side.
Never treat a hidden link as security.

## What you'll actually touch when building

- **Adding a public page?** Create `src/app/(public)/whatever/page.tsx`.
  The public layout (header + nav + footer) is applied automatically.
- **Adding a dashboard screen?** Create `src/app/dashboard/whatever/page.tsx`.
  The dashboard layout (sidebar + auth guard) is applied automatically.
- **Changing what the sidebar shows?** `src/components/dashboard/Sidebar.tsx`.
- **Adding an API endpoint?** Create `src/app/api/whatever/route.ts`. Import
  a Zod schema from `src/lib/validation.ts` and a permission check from
  `src/server/permissions.ts` before doing anything else.
- **Adding a database table?** Edit `prisma/schema.prisma`, run
  `npm run db:migrate`, then add a repository file under
  `src/server/repositories/`. API routes call repositories — never Prisma
  directly.

## Palette

Two token sets live in `tailwind.config.ts` on purpose:

| Token family        | Values                                                           | Where used                                   |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| **v1 (saturated)**  | `tmt-navy #062F3D`, `tmt-orange #FF7D00`, `tmt-cream #FFFCEE`     | Public site, dashboard (legacy)              |
| **v5 (warm)**       | `tmt-navy-warm #0C3444`, `tmt-amber #D98A1A`, `tmt-cream-warm #F5EFE0` | Auth pages, `/dev`, homepage-aligned |

Nothing is being removed — the warm tokens were added non-breakingly so the
public site + dashboard can adopt them one utility at a time when you're ready.

## Docs

- `docs/ARCHITECTURE.md` — layer discipline, auth pattern, permission model
- `docs/SETUP.md` — MySQL, Prisma, Auth.js activation
- `docs/DEPLOYMENT.md` — Vercel setup
- `docs/CONTRIBUTING.md` — team conventions

## Commands

```bash
npm run dev         # local dev on :3000
npm run build       # production build
npm run start       # serve the build
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
npm run db:generate # regenerate Prisma client
npm run db:migrate  # create + apply migration
npm run db:studio   # visual DB explorer
npm run db:seed     # load seed data
```
