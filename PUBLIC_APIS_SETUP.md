# Public APIs Import Setup

## Overview

The marketplace can be populated with real-world APIs from [publicapis.org](https://api.publicapis.org/entries). This document explains how to import them.

## API Endpoint

**Primary Endpoint**: `https://api.publicapis.org/entries`

**Response Format**:
```json
{
  "count": 1425,
  "entries": [
    {
      "API": "AdoptAPet",
      "Description": "Resource to help get pets adopted",
      "Auth": "apiKey",
      "HTTPS": true,
      "Cors": "yes",
      "Link": "https://www.adoptapet.com/public/apis/pet_list.html",
      "Category": "Animals"
    },
    ...
  ]
}
```

## How to Import APIs

### Method 1: Using the Admin Endpoint (Recommended)

```bash
# Import 100 APIs
curl -X POST http://localhost:3001/api/admin/sync-public-apis \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

### Method 2: Using the Cron Endpoint

```bash
# Import up to 100 APIs (no auth required in dev)
curl http://localhost:3001/api/cron/sync-apis
```

### Method 3: From the Frontend (if you have admin access)

1. Navigate to `/admin`
2. Use the sync button (if implemented)

## Import Process

1. **Fetch**: Fetches APIs from `https://api.publicapis.org/entries`
2. **Filter**: Validates APIs (must have name, link, category)
3. **Transform**: Maps categories to your system categories
4. **Store**: Creates API records in PostgreSQL database
5. **Version**: Creates default API version with OpenAPI spec
6. **Endpoint**: Creates a default endpoint

## Category Mapping

The system maps publicapis.org categories to your marketplace categories:

- `Animals`, `Anime`, `Art & Design` → `Other`
- `Books`, `Business`, `Data Validation` → `Data`
- `Cryptocurrency`, `Currency Exchange`, `Finance` → `Finance`
- `Machine Learning`, `Text Analysis` → `AI/ML`
- `Email`, `Phone` → `Communication`
- `Social` → `Social`
- `Tracking` → `Analytics`
- `Cloud Storage & File Sharing` → `Storage`
- And more...

## Features

- ✅ Auto-approves imported APIs (they appear in marketplace immediately)
- ✅ Creates system user for public APIs
- ✅ Skips duplicates (checks by slug)
- ✅ Handles errors gracefully
- ✅ Creates OpenAPI specs automatically
- ✅ Includes auth type, HTTPS, CORS info in changelog

## Testing

Test if the API is accessible:

```bash
curl http://localhost:3001/api/admin/test-public-apis
```

This will show:
- API accessibility
- Response format
- Sample entries
- Total count

## Troubleshooting

### Issue: "No APIs imported"

**Possible causes**:
1. All APIs already exist in database (check `skipped` count)
2. API endpoint is down or blocked
3. Network connectivity issues

**Solutions**:
1. Check server logs for detailed error messages
2. Test API endpoint: `curl https://api.publicapis.org/entries`
3. Try increasing the limit
4. Check database connection

### Issue: "API fetch failed"

**Possible causes**:
1. DNS resolution failure
2. Firewall blocking external requests
3. API endpoint changed

**Solutions**:
1. Check internet connectivity
2. Try fallback GitHub URL manually
3. Check server logs for specific error

## Example Response

```json
{
  "message": "Public APIs synced successfully",
  "imported": 50,
  "skipped": 10,
  "errors": 0
}
```

## Automation

Set up a cron job to sync automatically:

### Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-apis",
    "schedule": "0 2 * * *"
  }]
}
```

### Manual Cron

```bash
# Run daily at 2 AM
0 2 * * * curl -X POST https://your-domain.com/api/cron/sync-apis
```

## Notes

- The import process is **idempotent** - running it multiple times won't create duplicates
- APIs are imported with `isApproved: true` so they appear immediately
- The system user (`system@apiarena.com`) is created automatically if needed
- Each API gets a default version (1.0.0) and endpoint (/)
