"""Download and parse OpenAPI specs for catalog rows that have openapi_url."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import requests

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

UA = {"User-Agent": "APIArena-CatalogHydrate/1.0", "Accept": "application/json, application/yaml, text/yaml, text/plain, */*"}
TIMEOUT = 45


def _parse_spec(text: str, url: str) -> dict[str, Any] | None:
    text = (text or "").strip()
    if not text:
        return None
    # JSON first
    try:
        data = json.loads(text)
        if isinstance(data, dict) and ("openapi" in data or "swagger" in data or "paths" in data):
            return data
    except Exception:
        pass
    if yaml is not None:
        try:
            data = yaml.safe_load(text)
            if isinstance(data, dict) and ("openapi" in data or "swagger" in data or "paths" in data):
                return data
        except Exception:
            pass
    return None


def count_endpoints(spec: dict[str, Any]) -> int:
    paths = spec.get("paths") or {}
    if not isinstance(paths, dict):
        return 0
    n = 0
    methods = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}
    for _path, ops in paths.items():
        if not isinstance(ops, dict):
            continue
        for m in ops:
            if str(m).lower() in methods:
                n += 1
    return n


def extract_base_url(spec: dict[str, Any]) -> str:
    servers = spec.get("servers")
    if isinstance(servers, list) and servers:
        url = servers[0].get("url") if isinstance(servers[0], dict) else None
        if url:
            return str(url).rstrip("/")
    # swagger 2
    host = spec.get("host")
    base = spec.get("basePath") or ""
    schemes = spec.get("schemes") or ["https"]
    if host:
        scheme = schemes[0] if schemes else "https"
        return f"{scheme}://{host}{base}".rstrip("/")
    return ""


def is_try_ready(endpoint_count: int, https: bool, has_real_paths: bool) -> bool:
    return has_real_paths and endpoint_count >= 2 and https


def hydrate_row(
    sess: requests.Session,
    row: dict[str, str],
    specs_dir: Path,
    force: bool = False,
) -> dict[str, str]:
    """
    Fetch OpenAPI for a single CSV row. Writes spec file when successful.
    Updates endpoint_count, try_ready, openapi_hydrated, maybe base_url/arena_score.
    """
    url = (row.get("openapi_url") or "").strip()
    key = row.get("source_key") or ""
    if not url or not key:
        row.setdefault("endpoint_count", row.get("endpoint_count") or "0")
        row.setdefault("try_ready", row.get("try_ready") or "false")
        row.setdefault("openapi_hydrated", row.get("openapi_hydrated") or "false")
        return row

    specs_dir.mkdir(parents=True, exist_ok=True)
    spec_path = specs_dir / f"{key}.json"
    if spec_path.exists() and not force:
        try:
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            ec = count_endpoints(spec)
            https = str(row.get("https", "true")).lower() == "true"
            row["endpoint_count"] = str(ec)
            row["openapi_hydrated"] = "true"
            row["has_openapi"] = "true"
            row["try_ready"] = "true" if is_try_ready(ec, https, ec >= 2) else "false"
            base = extract_base_url(spec)
            if base and not row.get("base_url"):
                row["base_url"] = base
            # bump score slightly when hydrated with real endpoints
            try:
                score = int(row.get("arena_score") or 0)
                if ec >= 2:
                    score = min(100, score + 8)
                row["arena_score"] = str(score)
            except Exception:
                pass
            return row
        except Exception:
            pass

    try:
        r = sess.get(url, timeout=TIMEOUT, headers=UA)
        if r.status_code != 200:
            row["openapi_hydrated"] = "false"
            row["endpoint_count"] = row.get("endpoint_count") or "0"
            row["try_ready"] = "false"
            return row
        spec = _parse_spec(r.text, url)
        if not spec:
            row["openapi_hydrated"] = "false"
            row["endpoint_count"] = "0"
            row["try_ready"] = "false"
            return row

        # Keep specs bounded for seed size
        paths = spec.get("paths") or {}
        if isinstance(paths, dict) and len(paths) > 80:
            # keep first 80 paths alphabetically for storage budget
            keep = dict(sorted(paths.items())[:80])
            spec = {**spec, "paths": keep}

        spec_path.write_text(json.dumps(spec, ensure_ascii=False), encoding="utf-8")
        ec = count_endpoints(spec)
        https = str(row.get("https", "true")).lower() == "true"
        row["endpoint_count"] = str(ec)
        row["openapi_hydrated"] = "true"
        row["has_openapi"] = "true"
        row["try_ready"] = "true" if is_try_ready(ec, https, ec >= 2) else "false"
        base = extract_base_url(spec)
        if base:
            row["base_url"] = base
        try:
            score = int(row.get("arena_score") or 0)
            if ec >= 2:
                score = min(100, score + 8)
            row["arena_score"] = str(score)
        except Exception:
            pass
        return row
    except Exception:
        row["openapi_hydrated"] = "false"
        row["endpoint_count"] = row.get("endpoint_count") or "0"
        row["try_ready"] = "false"
        return row


def hydrate_catalog(
    rows: list[dict[str, str]],
    specs_dir: Path,
    limit: int = 200,
    force: bool = False,
) -> tuple[list[dict[str, str]], dict[str, int]]:
    """
    Hydrate top `limit` active rows that have openapi_url, preferring high arena_score.
    """
    sess = requests.Session()
    sess.headers.update(UA)

    candidates = [
        r
        for r in rows
        if r.get("status", "active") == "active"
        and (r.get("openapi_url") or "").strip()
        and (force or r.get("openapi_hydrated") != "true")
    ]
    candidates.sort(key=lambda r: int(r.get("arena_score") or 0), reverse=True)
    if limit > 0:
        candidates = candidates[:limit]

    stats = {"attempted": 0, "hydrated": 0, "failed": 0, "skipped_cached": 0}
    by_key = {r["source_key"]: r for r in rows if r.get("source_key")}

    for i, row in enumerate(candidates):
        stats["attempted"] += 1
        key = row["source_key"]
        before = row.get("openapi_hydrated")
        updated = hydrate_row(sess, dict(row), specs_dir, force=force)
        by_key[key] = updated
        if updated.get("openapi_hydrated") == "true":
            stats["hydrated"] += 1
            if before == "true" and not force:
                stats["skipped_cached"] += 1
        else:
            stats["failed"] += 1
        if (i + 1) % 25 == 0:
            print(f"  hydrate progress {i + 1}/{len(candidates)}")

    # preserve order of original rows, with updates
    out = []
    for r in rows:
        sk = r.get("source_key")
        out.append(by_key.get(sk, r) if sk else r)
    return out, stats
