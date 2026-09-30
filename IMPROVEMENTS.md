# APIArena Improvements

## MVP focus (current)

The project is intentionally scoped as a **simple portfolio MVP**:

Publish → Approve → Discover → Keys → Playground → Usage + Billing

See [README.md](./README.md) for what is in / out of scope.

## Earlier additions (still available)

### Kong Gateway (optional)
- `lib/gateway/kong.ts` + `KONG_SETUP.md`
- Built-in gateway proxies upstream without Kong via `baseUrl` / OpenAPI `servers[0]`

### Public API import
- Admin sync from public-apis.org (`/api/admin/sync-public-apis`)

### UI
- Lottie / Heroicons / playground component

## Honest status

Docs previously over-claimed features (Rails, Connect payouts, encryption, interactive docs). Those claims have been corrected in the README. Prefer live RequestLog aggregates over mock charts.
