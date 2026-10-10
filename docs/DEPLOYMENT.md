# Deployment to Vercel

## One-time setup

1. Create a Vercel project pointed at the GitHub repository.
2. Provision a managed MySQL instance (PlanetScale, Railway, Neon-with-MySQL,
   or Amazon RDS).
3. In the Vercel project → Settings → Environment Variables, add:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your Vercel production URL)
   - `NEXTAUTH_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (if using Vercel Blob for media)
   - `NEXT_PUBLIC_SITE_URL`
4. Add the Vercel Blob store (or configure S3 credentials).

## First deploy

```bash
# From your local machine, once
npx prisma migrate deploy
```

Push to `main`. Vercel builds and deploys automatically.

## Every subsequent deploy

- Push to a feature branch → get a Preview Deployment.
- Merge to `main` → Production Deployment.
- Schema changes: commit the migration file. Vercel runs
  `prisma migrate deploy` during build (add it to the build command if not
  already there).

## Post-deploy checks

- The public site loads.
- `/login` renders.
- `/dashboard` redirects to `/login` when signed out.
- `/api/articles` returns the seeded articles.
