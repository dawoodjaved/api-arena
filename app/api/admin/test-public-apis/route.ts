import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Test endpoint to check if publicapis.org API is accessible
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Testing publicapis.org API...");
    
    const response = await axios.get("https://api.publicapis.org/entries", {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.data;
    
    // Check response format
    let entries: any[] = [];
    let count = 0;

    if (data && typeof data === 'object') {
      if (Array.isArray(data.entries)) {
        entries = data.entries;
        count = data.count || entries.length;
      } else if (Array.isArray(data)) {
        entries = data;
        count = data.length;
      }
    }

    // Get sample entries
    const sample = entries.slice(0, 5).map((entry: any) => ({
      API: entry.API,
      Description: entry.Description?.substring(0, 100),
      Category: entry.Category,
      Link: entry.Link,
      Auth: entry.Auth,
      HTTPS: entry.HTTPS,
      Cors: entry.Cors,
    }));

    return NextResponse.json({
      success: true,
      message: "API is accessible",
      totalCount: count,
      sampleEntries: sample,
      responseFormat: {
        hasEntries: Array.isArray(data.entries),
        isDirectArray: Array.isArray(data),
        hasCount: typeof data.count === 'number',
      },
    });
  } catch (error: any) {
    console.error("Error testing publicapis.org API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.response?.data || "No response data",
        status: error.response?.status,
      },
      { status: 500 }
    );
  }
}
