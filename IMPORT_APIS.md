# Importing APIs from GitHub Repository

This project fetches APIs from the [public-apis/public-apis](https://github.com/public-apis/public-apis) GitHub repository.

The repository data is served via the API endpoint: `https://api.publicapis.org/entries`

Since the server may not be able to reach external APIs, use one of these methods:

## Method 1: Browser Console (Recommended)

1. Open your app in browser: `http://localhost:3001`
2. Open browser console (F12)
3. Copy and paste this code (or use the script from `scripts/fetch-from-github.js`):

```javascript
(async () => {
  try {
    console.log('Fetching APIs from GitHub repository (via api.publicapis.org)...');
    const response = await fetch('https://api.publicapis.org/entries');
    const data = await response.json();
    console.log(`Fetched ${data.entries?.length || 0} APIs from GitHub repository`);
    
    const importResponse = await fetch('http://localhost:3001/api/admin/import-apis-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: data.entries || data, limit: 100 }),
    });
    
    const result = await importResponse.json();
    console.log('Import result:', result);
    alert(`✅ Imported ${result.imported} APIs\n⏭️ Skipped: ${result.skipped}\n❌ Errors: ${result.errors}`);
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
})();
```

## Method 2: Direct API Call (If Server Has Internet Access)

If your server can reach the GitHub repository API, use:

```bash
curl -X POST http://localhost:3001/api/admin/create-sample-apis \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

This will automatically fetch from the GitHub repository via `api.publicapis.org/entries`.

## Method 3: Manual Import Endpoint

If you have the API data, send it directly:

```bash
curl -X POST http://localhost:3001/api/admin/import-apis-data \
  -H "Content-Type: application/json" \
  -d '{"entries": [...], "limit": 100}'
```
