"""Fetch and normalize remote API directory feeds into APIDoorway catalog rows."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import requests

from enrich import (
    arena_score,
    base_url_from_link,
    logo_url,
    map_category,
    normalize_auth,
    normalize_cors,
    parse_https,
    slugify,
    source_key,
    tags_from,
)

UA = {"User-Agent": "APIDoorway-CatalogSync/1.0", "Accept": "application/json"}
TIMEOUT = 90
FEEDS_LOCAL = Path(__file__).resolve().parent / "feeds.local.json"
FEEDS_EXAMPLE = Path(__file__).resolve().parent / "feeds.example.json"


def _load_feeds() -> dict[str, Any]:
    path = FEEDS_LOCAL if FEEDS_LOCAL.exists() else FEEDS_EXAMPLE
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise RuntimeError(f"Invalid feeds file: {path}")
    return data


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update(UA)
    return s


def _empty_row() -> dict[str, Any]:
    return {
        "source_key": "",
        "slug": "",
        "name": "",
        "description": "",
        "category": "Other",
        "raw_category": "",
        "auth_type": "none",
        "https": "true",
        "cors": "unknown",
        "docs_url": "",
        "base_url": "",
        "openapi_url": "",
        "has_openapi": "false",
        "logo": "",
        "source": "",
        "tags": "",
        "arena_score": "0",
        "featured": "false",
        "status": "active",
    }


def _finalize(row: dict[str, Any]) -> dict[str, Any]:
    row["slug"] = slugify(row.get("slug") or row.get("name") or "api")
    row["auth_type"] = normalize_auth(row.get("auth_type"))
    row["cors"] = normalize_cors(row.get("cors"))
    row["https"] = "true" if parse_https(row.get("https"), row.get("docs_url")) else "false"
    row["has_openapi"] = (
        "true"
        if row.get("has_openapi") in (True, "true", "1", 1, "yes") or row.get("openapi_url")
        else "false"
    )
    if not row.get("logo"):
        row["logo"] = logo_url(row["slug"])
    if not row.get("base_url"):
        row["base_url"] = base_url_from_link(row.get("docs_url") or row.get("openapi_url"))
    if not row.get("source_key"):
        row["source_key"] = source_key(row.get("source") or "x", row["slug"], row.get("docs_url") or "")
    tags = tags_from(row)
    row["tags"] = "|".join(tags)
    row["arena_score"] = str(arena_score(row))
    row["status"] = row.get("status") or "active"
    row["featured"] = "true" if row.get("featured") in (True, "true", "1", 1) else "false"
    for k in ("https", "has_openapi", "featured"):
        row[k] = "true" if str(row.get(k)).lower() in {"true", "1", "yes"} else "false"
    return row


def fetch_directory_entries(
    sess: requests.Session, urls: list[str], key_ns: str
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for url in urls:
        if not url or "example.com" in url:
            continue
        try:
            r = sess.get(url, timeout=TIMEOUT)
            if r.status_code != 200:
                continue
            data = r.json()
            entries = data.get("entries") if isinstance(data, dict) else data
            if not isinstance(entries, list) or not entries:
                continue
            for e in entries:
                name = (e.get("API") or e.get("Name") or "").strip()
                link = (e.get("Link") or e.get("URL") or "").strip()
                if not name or not link:
                    continue
                row = _empty_row()
                row.update(
                    {
                        "name": name[:200],
                        "description": (e.get("Description") or f"API: {name}")[:2000],
                        "raw_category": e.get("Category") or "",
                        "category": map_category(e.get("Category")),
                        "auth_type": e.get("Auth") or "none",
                        "https": e.get("HTTPS"),
                        "cors": e.get("Cors") or "unknown",
                        "docs_url": link,
                        "source": "directory",
                        "source_key": source_key(key_ns, name, link),
                    }
                )
                rows.append(_finalize(row))
            if rows:
                print(f"  directory feed: {len(rows)} rows")
                return rows
        except Exception as ex:
            print(f"  warn: directory feed failed: {ex}")
    return rows


def fetch_directory_readme(
    sess: requests.Session, url: str, key_ns: str
) -> list[dict[str, Any]]:
    if not url or "example.com" in url:
        return []
    try:
        r = sess.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        text = r.text
    except Exception as ex:
        print(f"  warn: markdown feed failed: {ex}")
        return []

    rows: list[dict[str, Any]] = []
    current_cat = "Other"
    row_re = re.compile(
        r"^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|",
        re.M,
    )

    for line in text.splitlines():
        cm = re.match(r"^###\s+(.+)$", line.strip())
        if cm:
            current_cat = cm.group(1).strip()
            continue
        m = row_re.match(line.strip())
        if not m:
            continue
        name, link, desc, auth, https, cors = [x.strip() for x in m.groups()]
        if not name or not link or name.lower() == "api":
            continue
        row = _empty_row()
        row.update(
            {
                "name": name[:200],
                "description": (desc or f"API: {name}")[:2000],
                "raw_category": current_cat,
                "category": map_category(current_cat),
                "auth_type": auth,
                "https": https,
                "cors": cors,
                "docs_url": link,
                "source": "directory",
                "source_key": source_key(key_ns, name, link),
            }
        )
        rows.append(_finalize(row))

    print(f"  markdown feed: {len(rows)} rows")
    return rows


def fetch_openapi_index(
    sess: requests.Session, url: str, key_ns: str
) -> list[dict[str, Any]]:
    if not url or "example.com" in url:
        return []
    try:
        r = sess.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception as ex:
        print(f"  warn: OpenAPI index failed: {ex}")
        return []

    if not isinstance(data, dict):
        return []

    rows: list[dict[str, Any]] = []
    for key, value in data.items():
        if not isinstance(value, dict):
            continue
        preferred = value.get("preferred")
        versions = value.get("versions") or {}
        ver = None
        if preferred and preferred in versions:
            ver = versions[preferred]
        elif versions:
            ver = next(iter(versions.values()))
        if not isinstance(ver, dict):
            continue
        info = ver.get("info") or {}
        name = (info.get("title") or value.get("name") or key).strip()
        desc = (info.get("description") or value.get("description") or f"OpenAPI: {name}").strip()
        desc = re.sub(r"<[^>]+>", " ", desc)
        desc = re.sub(r"\s+", " ", desc).strip()
        openapi_url = (
            ver.get("swaggerYamlUrl")
            or ver.get("swaggerUrl")
            or ver.get("openapiYaml")
            or ver.get("openapi")
            or ""
        )
        docs = info.get("x-origin") or [{}]
        docs_url = ""
        if isinstance(docs, list) and docs and isinstance(docs[0], dict):
            docs_url = docs[0].get("url") or ""
        external = info.get("externalDocs") or {}
        if isinstance(external, dict) and external.get("url"):
            docs_url = docs_url or external["url"]
        logo = ""
        xlogo = info.get("x-logo") or {}
        if isinstance(xlogo, dict):
            logo = xlogo.get("url") or ""

        categories = (
            info.get("x-categories")
            or info.get("x-" + "apisguru" + "-categories")
            or []
        )
        raw_cat = categories[0] if isinstance(categories, list) and categories else "Development"

        row = _empty_row()
        row.update(
            {
                "name": name[:200],
                "description": desc[:2000] or f"OpenAPI catalog entry: {name}",
                "raw_category": str(raw_cat),
                "category": map_category(str(raw_cat)),
                "auth_type": "unknown",
                "https": "true",
                "cors": "unknown",
                "docs_url": docs_url or openapi_url,
                "openapi_url": openapi_url,
                "has_openapi": "true" if openapi_url else "false",
                "logo": logo,
                "source": "openapi",
                "source_key": source_key(key_ns, key),
                "slug": slugify(key.replace(":", "-").replace(".", "-")),
            }
        )
        rows.append(_finalize(row))

    print(f"  OpenAPI index: {len(rows)} rows")
    return rows


def merge_catalogs(
    directory_rows: list[dict[str, Any]],
    openapi_rows: list[dict[str, Any]],
    merge_ns: str,
) -> list[dict[str, Any]]:
    """Merge directory + OpenAPI rows; prefer OpenAPI metadata when both match."""
    by_key: dict[str, dict[str, Any]] = {}

    def host(url: str) -> str:
        try:
            from urllib.parse import urlparse

            h = (urlparse(url).netloc or "").lower()
            if h.startswith("www."):
                h = h[4:]
            return h
        except Exception:
            return ""

    def merge_key(row: dict[str, Any]) -> str:
        return f"{slugify(row.get('name') or '')}|{host(row.get('docs_url') or row.get('openapi_url') or '')}"

    for row in directory_rows:
        by_key[merge_key(row)] = dict(row)

    for row in openapi_rows:
        k = merge_key(row)
        if k in by_key:
            base = by_key[k]
            base["openapi_url"] = row.get("openapi_url") or base.get("openapi_url")
            base["has_openapi"] = "true" if base.get("openapi_url") else base.get("has_openapi")
            if row.get("logo") and (not base.get("logo") or "dicebear" in base.get("logo", "")):
                base["logo"] = row["logo"]
            if len(row.get("description") or "") > len(base.get("description") or ""):
                base["description"] = row["description"]
            base["source"] = "merged"
            base["source_key"] = source_key(
                merge_ns, base.get("name") or "", base.get("docs_url") or ""
            )
            by_key[k] = _finalize(base)
        else:
            by_key[k if k not in by_key else row["source_key"]] = dict(row)

    final: dict[str, dict[str, Any]] = {}
    for row in by_key.values():
        sk = row["source_key"]
        if sk in final:
            a, b = final[sk], row
            pick = b if int(b.get("arena_score") or 0) > int(a.get("arena_score") or 0) else a
            if b.get("has_openapi") == "true" and a.get("has_openapi") != "true":
                pick = _finalize(
                    {
                        **a,
                        **{
                            k: b[k]
                            for k in ("openapi_url", "has_openapi", "logo", "source")
                            if b.get(k)
                        },
                    }
                )
            final[sk] = pick
        else:
            final[sk] = row

    ranked = sorted(final.values(), key=lambda r: int(r.get("arena_score") or 0), reverse=True)
    featured_budget = 12
    for row in ranked:
        if featured_budget <= 0:
            break
        if (
            row.get("has_openapi") == "true"
            and row.get("https") == "true"
            and int(row.get("arena_score") or 0) >= 70
        ):
            row["featured"] = "true"
            featured_budget -= 1

    return ranked


def fetch_all_sources() -> list[dict[str, Any]]:
    feeds = _load_feeds()
    if not FEEDS_LOCAL.exists():
        print(
            "NOTE: using feeds.example.json — copy to feeds.local.json "
            "and set real feed URLs for a full sync."
        )

    sess = _session()
    print("Fetching catalog feeds…")
    dir_ns = str(feeds.get("directory_key_ns") or "directory")
    open_ns = str(feeds.get("openapi_key_ns") or "openapi")
    entries = feeds.get("directory_entries") or []
    if isinstance(entries, str):
        entries = [entries]

    directory = fetch_directory_entries(sess, list(entries), dir_ns)
    if not directory:
        directory = fetch_directory_readme(
            sess, str(feeds.get("directory_readme") or ""), dir_ns
        )
    openapi = fetch_openapi_index(sess, str(feeds.get("openapi_index") or ""), open_ns)
    merged = merge_catalogs(directory, openapi, "merged")
    print(f"Merged catalog: {len(merged)} unique APIs")
    return merged
