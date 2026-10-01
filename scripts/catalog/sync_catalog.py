#!/usr/bin/env python3
"""
APIArena catalog sync

Fetches configured directory feeds, enriches rows, optionally hydrates OpenAPI
specs, updates the local CSV sheet, and writes seed JSON for `npm run db:seed`.

Feed URLs live in feeds.local.json (not committed). Copy feeds.example.json to start.

Usage:
  npm run catalog:venv
  npm run catalog:sync
  npm run catalog:sync -- --hydrate --hydrate-limit 200
  npm run catalog:hydrate
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from csv_store import load_csv, save_csv, sync_rows, write_report, write_seed_json  # noqa: E402
from hydrate_openapi import hydrate_catalog  # noqa: E402
from sources import fetch_all_sources  # noqa: E402

CSV_PATH = ROOT / "data" / "catalog" / "catalog.csv"
SEED_PATH = ROOT / "data" / "catalog" / "seed_catalog.json"
REPORT_PATH = ROOT / "data" / "catalog" / "SYNC_REPORT.md"
SPECS_DIR = ROOT / "data" / "catalog" / "specs"


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync API catalog into CSV + seed JSON")
    parser.add_argument("--seed-limit", type=int, default=0, help="Max active rows in seed JSON (0=all)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch + diff only; do not write files")
    parser.add_argument("--skip-fetch", action="store_true", help="Reuse existing CSV (hydrate-only mode)")
    parser.add_argument("--hydrate", action="store_true", help="Download OpenAPI specs for top rows")
    parser.add_argument("--hydrate-limit", type=int, default=200, help="Max specs to hydrate this run")
    parser.add_argument("--hydrate-force", action="store_true", help="Re-download even if cached")
    parser.add_argument("--csv", type=Path, default=CSV_PATH)
    parser.add_argument("--seed-json", type=Path, default=SEED_PATH)
    args = parser.parse_args()

    csv_path = args.csv
    hydrate_stats = None

    if args.skip_fetch:
        existing = load_csv(csv_path)
        if not existing:
            print("ERROR: no CSV found. Run without --skip-fetch first.")
            return 1
        merged = list(existing.values())
        stats = {"added": 0, "updated": 0, "unchanged": len(merged), "removed": 0, "reactivated": 0}
        print(f"Loaded existing sheet: {len(merged)} rows")
    else:
        incoming = fetch_all_sources()
        if not incoming:
            print("ERROR: no APIs fetched. Check feeds.local.json and network.")
            return 1
        existing = load_csv(csv_path)
        for row in incoming:
            old = existing.get(row["source_key"])
            if not old:
                row.setdefault("openapi_hydrated", "false")
                row.setdefault("endpoint_count", "0")
                row.setdefault("try_ready", "false")
                continue
            for k in ("openapi_hydrated", "endpoint_count", "try_ready"):
                if old.get(k) and not row.get(k):
                    row[k] = old[k]
            if old.get("openapi_hydrated") == "true" and old.get("base_url"):
                if not row.get("base_url") or row.get("source") == "openapi":
                    row["base_url"] = old["base_url"]
            if old.get("arena_score") and int(old.get("endpoint_count") or 0) >= 2:
                try:
                    if int(old["arena_score"]) > int(row.get("arena_score") or 0):
                        row["arena_score"] = old["arena_score"]
                except Exception:
                    pass
        merged, stats = sync_rows(existing, incoming)

    print("Diff:", stats)

    if args.hydrate:
        print(f"Hydrating OpenAPI specs (limit={args.hydrate_limit})…")
        merged, hydrate_stats = hydrate_catalog(
            merged,
            SPECS_DIR,
            limit=args.hydrate_limit,
            force=args.hydrate_force,
        )
        print("Hydrate:", hydrate_stats)

    print(f"Sheet would have {len(merged)} rows")

    if args.dry_run:
        print("Dry run — no files written.")
        return 0

    save_csv(csv_path, merged)
    seed_count = write_seed_json(
        args.seed_json,
        merged,
        limit=args.seed_limit if args.seed_limit > 0 else None,
    )
    write_report(
        REPORT_PATH,
        stats,
        total=len(merged),
        seed_count=seed_count,
        hydrate_stats=hydrate_stats,
    )

    print(f"Wrote {csv_path}")
    print(f"Wrote {args.seed_json} ({seed_count} active)")
    print(f"Wrote {REPORT_PATH}")
    if args.hydrate:
        print(f"Specs dir: {SPECS_DIR}")
    print("Next: npm run db:seed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
