"""Enrichment helpers: slug, category map, auth normalize, Endpointly Score."""
from __future__ import annotations

import hashlib
import re
from typing import Any
from urllib.parse import urlparse

CATEGORY_MAP: dict[str, str] = {
    "animals": "Other",
    "anime": "Other",
    "anti-malware": "Security",
    "art & design": "Other",
    "art and design": "Other",
    "books": "Data",
    "business": "Data",
    "calendar": "Other",
    "cloud storage & file sharing": "Storage",
    "cloud storage and file sharing": "Storage",
    "continuous integration": "Other",
    "cryptocurrency": "Finance",
    "currency exchange": "Finance",
    "data validation": "Data",
    "development": "Other",
    "dictionaries": "Data",
    "documents & productivity": "Other",
    "documents and productivity": "Other",
    "email": "Communication",
    "entertainment": "Other",
    "environment": "Data",
    "events": "Other",
    "finance": "Finance",
    "food & drink": "Other",
    "food and drink": "Other",
    "games & comics": "Other",
    "games and comics": "Other",
    "geocoding": "Data",
    "government": "Data",
    "health": "Data",
    "jobs": "Data",
    "machine learning": "AI/ML",
    "music": "Other",
    "news": "Data",
    "open data": "Data",
    "open source projects": "Other",
    "patent": "Data",
    "personality": "Other",
    "phone": "Communication",
    "photography": "Other",
    "programming": "Other",
    "science & math": "Data",
    "science and math": "Data",
    "security": "Security",
    "shopping": "Other",
    "social": "Social",
    "sports & fitness": "Other",
    "sports and fitness": "Other",
    "test data": "Data",
    "text analysis": "AI/ML",
    "tracking": "Analytics",
    "transportation": "Other",
    "url shorteners": "Other",
    "vehicle": "Other",
    "video": "Other",
    "weather": "Data",
    "payment": "Payment",
    "payments": "Payment",
    "ai": "AI/ML",
    "ml": "AI/ML",
    "analytics": "Analytics",
    "storage": "Storage",
    "communication": "Communication",
    "data": "Data",
}


def slugify(text: str, max_len: int = 80) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    if not s:
        s = "api"
    return s[:max_len]


def map_category(raw: str | None) -> str:
    if not raw:
        return "Other"
    key = raw.strip().lower()
    if key in CATEGORY_MAP:
        return CATEGORY_MAP[key]
    # partial match
    for k, v in CATEGORY_MAP.items():
        if k in key or key in k:
            return v
    return "Other"


def normalize_auth(raw: str | None) -> str:
    if not raw or not str(raw).strip():
        return "none"
    a = str(raw).strip().lower()
    if a in {"no", "none", "null", "n/a", "na", "-"}:
        return "none"
    if "oauth" in a:
        return "oauth"
    if "api" in a and "key" in a:
        return "apiKey"
    if a in {"apikey", "api-key", "api_key", "key"}:
        return "apiKey"
    if "http" in a or "basic" in a or "bearer" in a:
        return "http"
    if "x-mapi" in a or "header" in a:
        return "apiKey"
    return "unknown"


def normalize_cors(raw: str | None) -> str:
    if not raw:
        return "unknown"
    c = str(raw).strip().lower()
    if c in {"yes", "true", "y", "1"}:
        return "yes"
    if c in {"no", "false", "n", "0"}:
        return "no"
    return "unknown"


def parse_https(value: Any, link: str | None = None) -> bool:
    if isinstance(value, bool):
        return value
    if value is not None:
        s = str(value).strip().lower()
        if s in {"yes", "true", "y", "1"}:
            return True
        if s in {"no", "false", "n", "0"}:
            return False
    if link:
        return link.lower().startswith("https://")
    return True


def logo_url(seed: str) -> str:
    return (
        "https://api.dicebear.com/7.x/shapes/svg?"
        f"seed={seed}&backgroundColor=0d7377,12333a,b8d9da"
    )


def base_url_from_link(link: str | None) -> str:
    if not link:
        return ""
    try:
        p = urlparse(link.strip())
        if p.scheme and p.netloc:
            return f"{p.scheme}://{p.netloc}"
    except Exception:
        pass
    return link.strip()[:500]


def source_key(*parts: str) -> str:
    raw = "|".join(p.strip().lower() for p in parts if p)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:24]


def arena_score(row: dict[str, Any]) -> int:
    """
    Endpointly-unique developer-readiness score (0–100).
    Rewards HTTPS, clear auth, CORS, OpenAPI, docs, and description quality.
    """
    score = 20  # baseline listing
    if row.get("https") in (True, "true", "1", 1, "yes"):
        score += 15
    auth = normalize_auth(str(row.get("auth_type") or row.get("auth") or ""))
    if auth == "none":
        score += 10  # easy to try
    elif auth in {"apiKey", "http"}:
        score += 12
    elif auth == "oauth":
        score += 8
    cors = normalize_cors(str(row.get("cors") or ""))
    if cors == "yes":
        score += 12
    elif cors == "unknown":
        score += 4
    if row.get("has_openapi") in (True, "true", "1", 1, "yes"):
        score += 20
    if row.get("openapi_url"):
        score += 5
    desc = (row.get("description") or "").strip()
    if len(desc) >= 80:
        score += 10
    elif len(desc) >= 30:
        score += 6
    if row.get("docs_url"):
        score += 6
    tags = row.get("tags") or ""
    if isinstance(tags, list) and tags:
        score += 3
    elif isinstance(tags, str) and tags.strip():
        score += 3
    return max(0, min(100, int(score)))


def tags_from(row: dict[str, Any]) -> list[str]:
    tags: list[str] = []
    auth = normalize_auth(str(row.get("auth_type") or row.get("auth") or ""))
    if auth and auth != "none":
        tags.append(f"auth:{auth}")
    else:
        tags.append("auth:none")
    if row.get("has_openapi") in (True, "true", "1", 1, "yes"):
        tags.append("openapi")
    if row.get("https") in (True, "true", "1", 1, "yes"):
        tags.append("https")
    cors = normalize_cors(str(row.get("cors") or ""))
    if cors == "yes":
        tags.append("cors")
    src = (row.get("source") or "").strip()
    if src:
        tags.append(f"src:{src}")
    cat = (row.get("raw_category") or row.get("category") or "").strip()
    if cat:
        tags.append(slugify(cat, 40))
    # de-dupe preserve order
    seen = set()
    out = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out[:12]
