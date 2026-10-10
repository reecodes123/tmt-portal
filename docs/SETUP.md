# Local development setup

## Prerequisites

- Node.js 20+
- MySQL 8+ (local install, Docker, or a managed instance)
- npm

## Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in at least `DATABASE_URL` and `NEXTAUTH_SECRET`.

   Generate the secret with:
   ```bash
   openssl rand -base64 32
   ```

3. **Start MySQL** (Docker one-liner for local dev):
   ```bash
   docker run --name tmt-mysql -p 3306:3306 \
     -e MYSQL_ROOT_PASSWORD=devpassword \
     -e MYSQL_DATABASE=tmt_portal \
     -d mysql:8
   ```
   Then set:
   ```
   DATABASE_URL="mysql://root:devpassword@localhost:3306/tmt_portal"
   ```

4. **Create the schema**
   ```bash
   npm run db:migrate
   ```

5. **Seed data** (categories, sample articles, editorial board)
   ```bash
   npm run db:seed
   ```

6. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000. The public site should render. The dashboard is
   at `/dashboard` — you'll be redirected to `/login` until you seed an admin
   account.

## Creating the first admin account

Until the sign-up flow exists, seed an admin via `prisma/seed.ts`. See that
file for the pattern.
