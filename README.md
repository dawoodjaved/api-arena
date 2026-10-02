# APIDoorway

APIDoorway is a two-sided API marketplace built with Next.js. Providers publish OpenAPI specs, admins approve listings, and developers discover, compare, subscribe, and call APIs through a keyed gateway — with usage tracking and Stripe billing in the same product loop.

**Core flow:** Publish → Approve → Discover → Create key → Playground → Usage + Billing

---

## Features

**Marketplace**
- Browse and search an enriched catalog ranked by **APIDoorway Score** (HTTPS, auth, CORS, OpenAPI readiness)
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
cd apidoorway   # use your local folder name if different
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
| Developer | `dev@apidoorway.local` | `user1234` |

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
apidoorway/
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

## Deploy (Vercel — website only)

Standard Next.js project (no multi-service / no Python on Vercel).

1. Push to GitHub → Import in [Vercel](https://vercel.com) → Framework: **Next.js**.
2. Set environment variables (Production + Preview):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Neon **pooled** connection string (`sslmode=require`) |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_SECRET` | Yes | Same value as `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | Yes | `https://your-project.vercel.app` (or custom domain) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Add callback `https://…/api/auth/callback/google` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | Same for GitHub |
| `STRIPE_SECRET_KEY` | Optional | Billing |
| `STRIPE_WEBHOOK_SECRET` | Optional | After deploy, point Stripe webhook to `/api/stripe/webhooks` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Billing UI |
| `REDIS_URL` | Optional | Upstash `rediss://…` (rate limits); works without it |

3. Deploy. Build already runs `prisma generate && next build`.
4. Apply schema + seed **once** against Neon (from your laptop):

```bash
# with DATABASE_URL pointing at Neon
npx prisma db push
npm run db:seed
```

Catalog Python sync stays local for later — not part of this deploy.

---

## License

ISC
