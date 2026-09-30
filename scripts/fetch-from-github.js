/**
 * Script to fetch APIs from GitHub repository: public-apis/public-apis
 * 
 * This script can be run from:
 * 1. Browser console (recommended if server can't reach GitHub)
 * 2. Node.js environment with internet access
 * 
 * Usage in Browser:
 * 1. Open http://localhost:3001 in your browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 */

(async () => {
  try {
    console.log('Fetching APIs from GitHub repository: public-apis/public-apis...');
    
    // Try GitHub API endpoint that serves the repository data
    const apiUrl = 'https://api.publicapis.org/entries';
    
    console.log(`Fetching from: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'APIArena/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched data. Count: ${data.count || 'N/A'}, Entries: ${data.entries?.length || 0}`);
    
    // Send to server
    const importResponse = await fetch('http://localhost:3001/api/admin/import-apis-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entries: data.entries || data,
        limit: 100, // Adjust as needed
      }),
    });
    
    const result = await importResponse.json();
    console.log('Import result:', result);
    alert(`✅ Imported ${result.imported} APIs\n⏭️ Skipped: ${result.skipped}\n❌ Errors: ${result.errors}`);
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
})();
