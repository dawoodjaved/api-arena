"""CSV load/save and diff for the public APIs catalog sheet."""
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CSV_COLUMNS = [
    "source_key",
    "slug",
    "name",
    "description",
    "category",
    "raw_category",
    "auth_type",
    "https",
    "cors",
    "docs_url",
    "base_url",
    "openapi_url",
    "has_openapi",
    "openapi_hydrated",
    "endpoint_count",
    "try_ready",
    "logo",
    "source",
    "tags",
    "arena_score",
    "featured",
    "status",
    "first_seen",
    "last_seen",
    "last_changed",
]

COMPARE_FIELDS = [
    "name",
    "description",
    "category",
    "raw_category",
    "auth_type",
    "https",
    "cors",
    "docs_url",
    "base_url",
    "openapi_url",
    "has_openapi",
    "openapi_hydrated",
    "endpoint_count",
    "try_ready",
    "logo",
    "source",
    "tags",
    "arena_score",
    "featured",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_csv(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        out: dict[str, dict[str, str]] = {}
        for row in reader:
            key = (row.get("source_key") or "").strip()
            if not key:
                continue
            out[key] = {c: (row.get(c) or "") for c in CSV_COLUMNS}
        return out


def save_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in CSV_COLUMNS})


def sync_rows(
    existing: dict[str, dict[str, str]], incoming: list[dict[str, Any]]
) -> tuple[list[dict[str, str]], dict[str, int]]:
    """
    Merge incoming fetch into existing sheet.
    - new keys: added
    - same keys with field changes: updated
    - keys missing from fetch: marked status=removed (kept in sheet for history)
    """
    ts = now_iso()
    stats = {"added": 0, "updated": 0, "unchanged": 0, "removed": 0, "reactivated": 0}
    incoming_by_key = {r["source_key"]: r for r in incoming if r.get("source_key")}

    merged: dict[str, dict[str, str]] = {}

    for key, new in incoming_by_key.items():
        old = existing.get(key)
        row = {c: str(new.get(c, "") if new.get(c) is not None else "") for c in CSV_COLUMNS if c not in ("first_seen", "last_seen", "last_changed")}
        row["status"] = "active"
        row["last_seen"] = ts
        if not old:
            row["first_seen"] = ts
            row["last_changed"] = ts
            stats["added"] += 1
        else:
            row["first_seen"] = old.get("first_seen") or ts
            changed = any((old.get(f) or "") != (row.get(f) or "") for f in COMPARE_FIELDS)
            if old.get("status") == "removed":
                stats["reactivated"] += 1
                row["last_changed"] = ts
            elif changed:
                stats["updated"] += 1
                row["last_changed"] = ts
            else:
                stats["unchanged"] += 1
                row["last_changed"] = old.get("last_changed") or ts
        merged[key] = row

    for key, old in existing.items():
        if key in merged:
            continue
        row = dict(old)
        if row.get("status") != "removed":
            stats["removed"] += 1
            row["status"] = "removed"
            row["last_changed"] = ts
        merged[key] = row

    # Sort: active first by arena_score desc, then name
    def sort_key(r: dict[str, str]):
        active = 0 if r.get("status") == "active" else 1
        score = -int(r.get("arena_score") or 0)
        return (active, score, (r.get("name") or "").lower())

    ordered = sorted(merged.values(), key=sort_key)
    return ordered, stats


def write_seed_json(path: Path, rows: list[dict[str, str]], limit: int | None = None) -> int:
    """Write seed payload for prisma/seed.ts (active rows only)."""
    active = [r for r in rows if r.get("status") == "active"]
    if limit and limit > 0:
        active = active[:limit]
    payload = []
    for r in active:
        payload.append(
            {
                "sourceKey": r["source_key"],
                "slug": r["slug"],
                "name": r["name"],
                "description": r["description"],
                "category": r["category"],
                "authType": r["auth_type"],
                "https": r["https"] == "true",
                "cors": r["cors"],
                "docsUrl": r["docs_url"],
                "baseUrl": r["base_url"] or None,
                "openapiUrl": r["openapi_url"] or None,
                "hasOpenApi": r["has_openapi"] == "true",
                "openapiHydrated": r.get("openapi_hydrated") == "true",
                "endpointCount": int(r.get("endpoint_count") or 0),
                "tryReady": r.get("try_ready") == "true",
                "logo": r["logo"] or None,
                "source": r["source"],
                "tags": [t for t in (r.get("tags") or "").split("|") if t],
                "arenaScore": int(r.get("arena_score") or 0),
                "featured": r.get("featured") == "true",
            }
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(payload)


def write_report(
    path: Path,
    stats: dict[str, int],
    total: int,
    seed_count: int,
    hydrate_stats: dict[str, int] | None = None,
) -> None:
    ts = now_iso()
    active_hint = ""
    lines = [
        f"# Catalog sync report",
        "",
        f"- Ran at: `{ts}`",
        f"- Sheet rows (all statuses): **{total}**",
        f"- Seed JSON active rows: **{seed_count}**",
        "",
        "## Diff",
        "",
        f"- Added: {stats.get('added', 0)}",
        f"- Updated: {stats.get('updated', 0)}",
        f"- Unchanged: {stats.get('unchanged', 0)}",
        f"- Removed (kept in sheet): {stats.get('removed', 0)}",
        f"- Reactivated: {stats.get('reactivated', 0)}",
        "",
    ]
    if hydrate_stats:
        lines += [
            "## OpenAPI hydrate",
            "",
            f"- Attempted: {hydrate_stats.get('attempted', 0)}",
            f"- Hydrated: {hydrate_stats.get('hydrated', 0)}",
            f"- Failed: {hydrate_stats.get('failed', 0)}",
            "",
        ]
    lines += [
        "## Next",
        "",
        "1. Review local `data/catalog/catalog.csv` (not committed)",
        "2. Run `npm run db:seed` to upsert into Postgres",
        "",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
