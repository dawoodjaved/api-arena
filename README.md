# APIArena

APIArena is a two-sided API marketplace built with Next.js. Providers publish OpenAPI specs, admins approve listings, and developers discover, compare, subscribe, and call APIs through a keyed gateway — with usage tracking and Stripe billing in the same product loop.

**Core flow:** Publish → Approve → Discover → Create key → Playground → Usage + Billing

---

## Features

**Marketplace**
- Browse and search an enriched catalog ranked by **Arena Score** (HTTPS, auth, CORS, OpenAPI readiness)
- Filters for try-ready APIs, OpenAPI, auth type, HTTPS, and minimum score
- API detail pages with Swagger UI, code examples, Postman export, reviews, and side-by-side compare
- Lazy OpenAPI hydration on first open when a listing still needs a real spec

**Developer portal**
- Dashboard with onboarding checklist, usage snapshot, and curated picks
- API keys (hashed at rest), playground, usage charts, support tickets
- Free / Pro plans via Stripe Checkout and Customer Portal

**Providers & admin**
- OpenAPI / Swagger JSON & YAML import with endpoint extraction
- Versioning, deprecation banners, changelog
- Admin approve / reject and featured toggle

**Gateway**
- API-key auth, Redis rate limits, response cache, CORS
- Proxies to each API’s `baseUrl` (or OpenAPI `servers[0]`)
- Optional Kong integration

---

## Tech stack

| Layer | Choice |
|--------|--------|
| App | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS, Lucide, Recharts, Swagger UI |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js (credentials + Google / GitHub) |
| Payments | Stripe |
| Cache / limits | Redis (Upstash-friendly; in-memory fallback) |

---

## Quick start

**Requirements:** Node.js 18+, PostgreSQL. Redis and Stripe are optional for local demos.

```bash
git clone <repository-url>
cd api-arena
npm install
cp .env.example .env
```

Fill in `.env` (see `.env.example`). Minimum for local:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` / `AUTH_SECRET`
- `NEXTAUTH_URL=http://localhost:3000`

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seed logins**

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@apiarena.local` | `admin123` |
| Provider | `provider@apiarena.local` | `provider123` |
| Developer | `dev@apiarena.local` | `user1234` |

Seeding is idempotent — re-running `npm run db:seed` upserts by stable keys and does not create duplicate APIs, users, or reviews.

---

## Scripts

```bash
npm run dev          # local server
npm run build        # prisma generate + next build
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
```

---

## Project layout

```
api-arena/
├── app/
│   ├── api/            # REST routes (gateway, Stripe, catalog, admin, …)
│   ├── marketplace/    # Discovery, detail, compare
│   ├── dashboard/      # Keys, usage, billing, playground, support
│   ├── api-publisher/  # Publish / edit / versions
│   └── admin/          # Approval + featured
├── components/
├── lib/                # Auth, Stripe, gateway, services
├── prisma/             # Schema + seed (demo APIs)
├── scripts/            # Catalog sync + local helpers
└── data/catalog/       # Local catalog sheet/seed (gitignored data files)
```

---

## Deploy (Vercel)

Designed for **Vercel** + managed Postgres (e.g. Neon) + Redis (e.g. Upstash).

1. Push the repo to GitHub and import the project in Vercel.
2. Set the same env vars as `.env.example` (use your production `NEXTAUTH_URL`).
3. Point Stripe webhooks at `https://<your-domain>/api/stripe/webhooks`.
4. After first deploy, run migrations/seed against the production DB (`prisma db push` + `db:seed` from a machine with `DATABASE_URL`).

Typical free stack: Neon (Postgres) + Upstash (Redis) + Stripe test mode + Google/GitHub OAuth. Set the same keys in Vercel as in `.env.example`.

---

## License

ISC
