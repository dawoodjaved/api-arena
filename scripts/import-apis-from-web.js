/**
 * Script to import APIs from api.publicapis.org
 * Run this from your browser console or use it as a reference
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Run: fetch('https://api.publicapis.org/entries').then(r => r.json()).then(data => {
 *      fetch('/api/admin/import-apis-data', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ entries: data.entries, limit: 100 }) })
 *    })
 */

// This script can be run from browser console to import APIs
// when the server can't reach api.publicapis.org directly
