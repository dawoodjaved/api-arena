import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Test whether the configured directory feed URL is reachable.
 */
export async function GET(_request: NextRequest) {
  const feedUrl = process.env.CATALOG_DIRECTORY_FEED_URL?.trim();
  if (!feedUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "Set CATALOG_DIRECTORY_FEED_URL to test the directory feed.",
      },
      { status: 400 }
    );
  }

  try {
    console.log("Testing catalog directory feed…");

    const response = await axios.get(feedUrl, {
      timeout: 30000,
      headers: { Accept: "application/json" },
    });

    const data = response.data;
    let entries: any[] = [];
    let count = 0;

    if (data && typeof data === "object") {
      if (Array.isArray(data.entries)) {
        entries = data.entries;
        count = data.count || entries.length;
      } else if (Array.isArray(data)) {
        entries = data;
        count = data.length;
      }
    }

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
      message: "Feed is accessible",
      totalCount: count,
      sampleEntries: sample,
      responseFormat: {
        hasEntries: Array.isArray(data.entries),
        isDirectArray: Array.isArray(data),
        hasCount: typeof data.count === "number",
      },
    });
  } catch (error: any) {
    console.error("Error testing catalog feed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Feed unreachable",
      },
      { status: 500 }
    );
  }
}
