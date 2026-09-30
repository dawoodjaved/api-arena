# APIArena - API Marketplace & Management Platform

A practical two-sided marketplace where API providers publish OpenAPI specs, admins approve them, and developers discover, test, and subscribe to APIs.

**Core demo flow:** Publish → Approve → Discover → Create key → Playground → Usage + Billing

## What works today (MVP)

- OpenAPI / Swagger **JSON & YAML** import with endpoint extraction
- Interactive docs via **Swagger UI**
- Code examples (10+ languages) and Postman collection export
- Lightweight SDK **templates** (not full OpenAPI Generator)
- API versioning, deprecation banners, changelog text
- Gateway with API-key auth, Redis rate limits, optional Kong, upstream proxy
- Marketplace browse/search, featured APIs, reviews, side-by-side compare
- Developer portal: API keys, usage charts from request logs, billing (Free/Pro), playground, support tickets
- Admin approve/reject + featured toggle
- Stripe Checkout + Customer Portal (Free / Pro)

## Intentionally out of scope (for now)

- Separate Rails backend
- Stripe Connect / provider payouts / metered overage
- Platform OAuth2 IdP (user login still uses NextAuth)
- Load testing UI, mock servers, WebSocket playground
- Geo maps, real-time WebSockets, incident alerting
- AWS S3, Cloudflare WAF, PgBouncer

## Tech Stack

- **Frontend / Backend**: Next.js 14 (App Router) + API Routes
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth.js
- **Payments**: Stripe (subscriptions)
- **Docs**: Swagger UI
- **Cache / rate limits**: Redis (optional locally; required for gateway limits)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (recommended)
- Stripe test keys (optional for billing)

### Installation

```bash
git clone <repository-url>
cd api-arena
npm install
cp .env.example .env
```

Fill in `.env` (see [`.env.example`](./.env.example)). Then:

```bash
npx prisma generate
npx prisma db push
npm run db:seed   # polished catalog: 8 APIs, reviews, avatars
npm run db:approve
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seed logins**
- `admin@apiarena.local` / `admin123`
- `provider@apiarena.local` / `provider123`
- `dev@apiarena.local` / `user1234`

### Optional: Kong

See [KONG_SETUP.md](./KONG_SETUP.md). Without Kong, the built-in gateway proxies to each API’s `baseUrl` / OpenAPI `servers[0].url`.

### Optional: Sync public APIs

```bash
POST /api/admin/sync-public-apis
Body: { "limit": 50 }
```

(Requires an admin session.)

## Project Structure

```
api-arena/
├── app/
│   ├── api/              # API routes (gateway, stripe, admin, …)
│   ├── dashboard/        # Developer portal
│   ├── marketplace/      # Discovery + API detail
│   ├── api-publisher/    # Publish / edit / versions
│   └── admin/            # Approval + featured
├── components/
├── lib/                  # Auth, stripe, gateway, services
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── scripts/
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
npm test                  # smoke tests
```

## Deployment

Designed for **Vercel** (Next.js) + managed Postgres + Redis. Stripe webhooks need a public URL.

## License

ISC
