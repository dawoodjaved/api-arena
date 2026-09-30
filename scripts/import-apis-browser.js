/**
 * Browser-based script to import APIs from api.publicapis.org
 * 
 * Since the server can't reach api.publicapis.org, run this in your browser console
 * to fetch the data and send it to the server.
 * 
 * Usage:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open browser console (F12)
 * 3. Copy and paste this script, then run it
 */

(async () => {
  try {
    console.log('Fetching APIs from api.publicapis.org...');
    
    // Fetch from the API (works from browser)
    const response = await fetch('https://api.publicapis.org/entries');
    const data = await response.json();
    
    console.log(`Fetched ${data.entries?.length || 0} APIs`);
    
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
    alert(`Imported ${result.imported} APIs, ${result.skipped} skipped, ${result.errors} errors`);
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
})();
