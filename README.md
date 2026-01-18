# APIArena - API Marketplace & Management Platform

A comprehensive two-sided marketplace platform where API providers can publish, monetize, and manage their APIs while enabling developers to discover, test, and integrate APIs seamlessly.

## ✨ Recent Improvements

- **Kong Gateway Integration**: High-performance API gateway with automatic fallback
- **Public API Auto-Import**: Automatically syncs public APIs from public-apis.org
- **Enhanced UI**: Lottie animations, Heroicons, and improved playground
- **Better Developer Experience**: Hoppscotch-inspired API playground

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for details.

## Features

### 🚀 API Publishing System
- OpenAPI 3.0/Swagger 2.0 file import and validation
- Interactive documentation generator from OpenAPI spec
- Automatic code example generation (JavaScript, Python, Ruby, Go, PHP, Java, C#, Swift, Kotlin, Rust)
- Live "Try It Out" console with request/response preview
- One-click Postman collection export
- Automatic SDK generation using OpenAPI Generator
- Full API versioning system (v1, v2, etc.) with routing
- Deprecation warning system with sunset dates
- Detailed changelog with semantic versioning
- Markdown-based additional documentation editor

### 🌐 API Gateway Implementation
- Dynamic request routing based on API key and version
- Redis-based rate limiting with multiple tier support (100/hr Free, 10k/hr Pro, Unlimited Enterprise)
- API key authentication with scoping
- OAuth 2.0 provider implementation (authorization code, client credentials)
- Request/response transformation layer (header injection, body transformation)
- Redis caching with TTL and cache invalidation
- CORS middleware with configurable origins
- Webhook delivery system with retry logic and dead letter queue
- Request logging and tracing

### 🛒 Marketplace & Discovery
- Full-text search with filters (category, pricing, rating)
- Category-based browsing (Data, AI/ML, Finance, Social, Communication, etc.)
- Star ratings and text reviews system
- Code examples showcase per API
- Pricing comparison table (Free vs Pro vs Enterprise)
- Featured APIs section (curated by admin)
- Side-by-side API comparison tool (compare up to 3 APIs)
- Trending/Popular APIs based on usage
- Similar APIs recommendations

### 👨‍💻 Developer Portal
- **API Key Management**: Create/revoke API keys with custom names, scope-based permissions, key rotation
- **Usage Dashboard**: Real-time request counter, daily/weekly/monthly usage graphs, endpoint breakdown visualization, error rate monitoring, latency percentiles
- **Billing System**: Current plan display, upgrade/downgrade flow, invoice history with PDF download, payment method management (Stripe), usage overage alerts
- **API Playground**: Interactive request builder, authentication testing, request history, response inspector, cURL command generator
- **Testing Tools**: Automated endpoint testing suite, response validation against schema, performance benchmarking, load testing capabilities, mock server generation
- **Support System**: Ticket creation and tracking, priority support for paid tiers, FAQ/Knowledge base, API status page

### 💰 Monetization System
- Subscription Plans (Free, Pro, Enterprise)
- Usage-Based Billing (metered billing for requests beyond plan limits)
- Stripe Integration (customer portal, webhook handling, invoice PDF generation)
- Revenue Analytics for API providers (MRR tracking, subscription breakdown, churn rate calculation)
- Payout Management (automatic monthly payouts via Stripe Connect, revenue share: Platform 20%, Provider 80%)
- Trial Periods (14-day free trial for Pro plan)
- Volume Discounts (tiered pricing for high-volume usage)

### 📊 Analytics & Monitoring
- Request Analytics (total requests over time, requests by endpoint, requests by status code, requests by geography)
- Error Monitoring (error rate percentage, error breakdown by type, error logs with stack traces, alert system)
- Latency Tracking (average response time, percentile latency, latency by endpoint, slow query detection)
- Top Consumers (users by request volume, users by revenue generated, geographic distribution)
- Endpoint Performance (most called endpoints, slowest endpoints, endpoints with highest error rates, cache hit rate per endpoint)

### 🔐 Security Features
- API key encryption at rest
- Rate limiting per IP address
- DDoS protection (Cloudflare integration)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React default escaping)
- CSRF tokens for forms
- Content Security Policy headers
- Regular security audits logging

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth 2.0
- **Payments**: Stripe for subscriptions and usage-based billing
- **API Docs**: Swagger UI / OpenAPI integration
- **Caching**: Redis for rate limiting and response caching
- **Storage**: AWS S3 or similar for SDK storage
- **Monitoring**: Built-in analytics dashboard

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis instance
- Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd api-arena
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in the required environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/apiarena"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

4. Set up the database:
```bash
# See DATABASE_SETUP.md for detailed instructions
npx prisma generate
npx prisma db push
```

**Important**: If you see "Cannot fetch data from service: fetch failed" errors, your database is not connected. See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for troubleshooting.

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Quick Start Features

**Sync Public APIs:**
```bash
# As admin, sync public APIs
POST /api/admin/sync-public-apis
Body: { "limit": 50 }
```

**Setup Kong Gateway (Optional):**
See [KONG_SETUP.md](./KONG_SETUP.md) for Docker setup instructions.

## Project Structure

```
api-arena/
├── app/
│   ├── api/              # API routes
│   │   ├── apis/         # API CRUD operations
│   │   ├── gateway/      # API Gateway
│   │   ├── auth/         # Authentication
│   │   ├── stripe/       # Stripe integration
│   │   └── admin/        # Admin endpoints
│   ├── dashboard/        # Developer portal
│   ├── marketplace/      # Marketplace pages
│   ├── api-publisher/    # API publishing pages
│   └── admin/            # Admin panel
├── components/           # React components
├── lib/                  # Utility functions
│   ├── gateway/         # Gateway utilities
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Auth configuration
│   └── stripe.ts        # Stripe configuration
└── prisma/
    └── schema.prisma    # Database schema
```

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Testing

```bash
# Run tests (when implemented)
npm test
```

## Deployment

The application is designed to be deployed on:
- **Next.js**: Vercel
- **PostgreSQL**: AWS RDS or similar
- **Redis**: Redis Cloud or AWS ElastiCache
- **Storage**: AWS S3
- **CDN**: Cloudflare

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
