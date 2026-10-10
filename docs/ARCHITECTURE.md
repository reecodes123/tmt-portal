# Architecture

## Big picture

One Next.js App Router project deployed to Vercel, backed by a MySQL database.
Frontend and backend live in the same repo; the App Router's `api/` folder
holds the REST endpoints and `app/(public)` / `app/dashboard` hold the pages.

```
Browser
  │
  │  HTTP
  ▼
┌────────────────────────────────────────────────┐
│ Next.js on Vercel                              │
│                                                │
│  Server Components (public/*, dashboard/*)     │
│      calls repositories directly ────────┐     │
│                                          │     │
│  Client Components (interactivity)       │     │
│      calls /api/* via lib/api-client    │     │
│                                    │     │     │
│                                    ▼     ▼     │
│  API routes  ──> permissions ──> repositories  │
│                                        │       │
└────────────────────────────────────────┼───────┘
                                         ▼
                                     MySQL (Prisma)
```

## Route groups

- `(public)/` — reader-facing site with Header/Nav/Footer. Includes home,
  category pages, article detail, bookmarks, search, about, editorial board,
  terms.
- `(auth)/` — sign-in page, no site chrome.
- `dashboard/` — CMS. Not a route group: `/dashboard` is the URL. Server-side
  auth guard in its layout. Sidebar filters items based on role.
- `api/` — REST endpoints. Every mutating endpoint validates input with Zod,
  checks permissions with `server/permissions.ts`, then calls a repository.

## Three layers of dashboard auth

1. **`middleware.ts`** — edge, cheap, redirects unauthenticated requests to
   `/login`. Runs before any React code.
2. **`dashboard/layout.tsx`** — server component, checks the session again,
   redirects if role is wrong. Defense in depth.
3. **API routes** — every mutating endpoint checks the session and role. This
   is the only layer that actually matters for security. The others exist so
   the client experience is fast and correct.

**Rule:** never treat client-side hiding as authorization. The Sidebar filters
admin-only items for editors, but that's UX; the routes and API endpoints
still enforce it independently.

## Data flow

- **Server Components** call repositories in `src/server/repositories/`
  directly. No HTTP round-trip.
- **Client Components** call `/api/*` through the typed wrapper in
  `src/lib/api-client.ts`.
- **Repositories** are the only place Prisma is imported.
- **Anonymous engagement** (likes, bookmarks, views) hits `/api/*` without
  authentication. The endpoint increments a counter — no identifier stored.

## Naming decisions

- **Roles:** `reader | editor | admin`. Editorial titles (Chief Editor,
  Section Editor) are display labels on the Editorial Board, not login roles.
- **Article status:** `draft | in_review | published`. Editors submit for
  review; only admins publish. Set in `server/permissions.ts:canPublishArticle`.
- **Category vs. section:** only "category" is used in code and UI. The
  prototypes' two terms named the same concept.
- **Article URLs:** `/articles/[slug]`, not `/article/:id`. Better for SEO.
- **Editorial Board and User accounts are separate.** Board members appear on
  the org chart; not all board members log in.

## Anonymous readers

- No user table entry.
- Bookmarks + likes stored in `localStorage` via `useLocalBookmarks` /
  `useLocalLikes`.
- Aggregate counters on the article row are updated via public API endpoints
  (`/api/articles/[id]/like` etc.). Each request is just `{ active: true|false }`
  — no identifier sent.
- One anonymous session ID lives in `localStorage` for internal use (visit
  dedup only) and is never transmitted.

## Data privacy (RA 10173)

Zero personal data collected from readers. `PrivacyNotice.tsx` shows a one-time
banner explaining the trade-off (bookmarks are per-browser). Editor and admin
data is stored (email, name, bcrypt-hashed password) — standard for CMS staff.

## Extension points

New content type? Add:

1. A model to `prisma/schema.prisma`
2. A file to `src/server/repositories/`
3. A route to `src/app/api/{name}/`
4. Zod schemas to `src/lib/validation.ts`
5. (Optionally) a page + component in the dashboard

New user role? Update:

1. `UserRole` in `src/types/domain.ts`
2. The `UserRole` enum in `prisma/schema.prisma`
3. Permission functions in `src/server/permissions.ts`
4. The Sidebar's `adminOnly` filter if the new role sees different nav
