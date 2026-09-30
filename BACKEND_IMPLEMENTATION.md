# Backend Implementation Summary

Honest status of backend features for the MVP.

## Working

| Feature | Location | Notes |
|---------|----------|-------|
| SDK templates | `lib/services/sdk-generator.ts` | Lightweight templates (not OpenAPI Generator CLI) |
| Code examples | `lib/services/code-examples.ts` | 10+ languages |
| Postman export | `lib/services/postman-collection.ts` | OpenAPI → Postman v2.1 |
| OpenAPI import | `app/api/apis/import/route.ts` | JSON + YAML |
| Gateway | `app/api/gateway/[...slug]/route.ts` | Auth, Redis rate limits, upstream proxy, optional Kong |
| Stripe Checkout + Portal | `app/api/stripe/` | Free/Pro; customer ID on User |
| Reviews / tickets / search | `app/api/reviews`, `tickets`, `search` | |

## Partial / demo-grade

- OAuth2 routes under `app/api/oauth2/` — not a full IdP; prefer NextAuth for users
- Webhook queue in Redis — not wired to all domain events
- Analytics snapshots cron — prefer live RequestLog aggregates in UI

## Out of scope for MVP

- Stripe Connect payouts, metered overage, Rails service, S3 SDK storage
