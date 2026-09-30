#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> APIArena local setup"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy from .env.example and fill values"
  exit 1
fi

echo "==> Prisma generate + push"
npx prisma generate
npx prisma db push

echo "==> Seed demo users + API"
npm run db:seed

echo "==> Approve public APIs"
npx tsx -e '
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
const p = new PrismaClient();
await p.aPI.updateMany({ data: { isApproved: true, isPublic: true } });
console.log("APIs approved");
await p.\$disconnect();
'

echo ""
echo "Done. Start with: npm run dev"
echo "Open: http://localhost:3000"
echo "Health: http://localhost:3000/api/health"
echo ""
echo "Seed logins:"
echo "  admin@apiarena.local / admin123"
echo "  provider@apiarena.local / provider123"
echo ""
echo "Optional from you:"
echo "  - Stripe test keys in .env.local (billing)"
echo "  - Google/GitHub OAuth apps (social login)"
echo "  - Docker Desktop running + redis container (rate limits)"
