import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PublicAPIEntry {
  API: string;
  Description: string;
  Auth: string;
  HTTPS: boolean;
  Cors: string;
  Link: string;
  Category: string;
}

/**
 * Import APIs from request body (when the server cannot reach remote feeds).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries: PublicAPIEntry[] = body.entries || [];
    const limit = body.limit || 100;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Invalid data. Expected 'entries' array in request body." },
        { status: 400 }
      );
    }

    // Get or create system user
    let systemUser = await prisma.user.findFirst({
      where: { email: "system@apidoorway.com" },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          name: "System",
          email: "system@apidoorway.com",
          role: "provider",
        },
      });
    }

    // Category mapping
    const categoryMap: Record<string, string> = {
      "Animals": "Other",
      "Anime": "Other",
      "Anti-Malware": "Security",
      "Art & Design": "Other",
      "Books": "Data",
      "Business": "Data",
      "Calendar": "Other",
      "Cloud Storage & File Sharing": "Storage",
      "Continuous Integration": "Other",
      "Cryptocurrency": "Finance",
      "Currency Exchange": "Finance",
      "Data Validation": "Data",
      "Development": "Other",
      "Dictionaries": "Data",
      "Documents & Productivity": "Other",
      "Email": "Communication",
      "Entertainment": "Other",
      "Environment": "Data",
      "Events": "Other",
      "Finance": "Finance",
      "Food & Drink": "Other",
      "Games & Comics": "Other",
      "Geocoding": "Data",
      "Government": "Data",
      "Health": "Data",
      "Jobs": "Data",
      "Machine Learning": "AI/ML",
      "Music": "Other",
      "News": "Data",
      "Open Data": "Data",
      "Open Source Projects": "Other",
      "Patent": "Data",
      "Personality": "Other",
      "Phone": "Communication",
      "Photography": "Other",
      "Programming": "Other",
      "Science & Math": "Data",
      "Security": "Security",
      "Shopping": "Other",
      "Social": "Social",
      "Sports & Fitness": "Other",
      "Test Data": "Data",
      "Text Analysis": "AI/ML",
      "Tracking": "Analytics",
      "Transportation": "Other",
      "URL Shorteners": "Other",
      "Vehicle": "Other",
      "Video": "Other",
      "Weather": "Data",
    };

    const mapCategory = (category: string): string => {
      return categoryMap[category] || "Other";
    };

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const apisToImport = entries.slice(0, limit);

    for (const api of apisToImport) {
      try {
        if (!api.API || !api.Link || !api.Category) {
          skipped++;
          continue;
        }

        const slug = api.API.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 100);

        if (!slug) {
          skipped++;
          continue;
        }

        const existing = await prisma.aPI.findUnique({
          where: { slug },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const createdAPI = await prisma.aPI.create({
          data: {
            name: api.API.trim().substring(0, 200),
            slug: slug,
            description: (api.Description || `Public API: ${api.API}`).trim().substring(0, 2000),
            category: mapCategory(api.Category),
            isPublic: true,
            isApproved: true,
            isFeatured: false,
            userId: systemUser.id,
          },
        });

        const version = await prisma.aPIVersion.create({
          data: {
            apiId: createdAPI.id,
            version: "1.0.0",
            openApiSpec: {
              openapi: "3.0.0",
              info: {
                title: api.API,
                description: api.Description || `Public API: ${api.API}`,
                version: "1.0.0",
              },
              servers: [
                {
                  url: api.Link,
                  description: "Public API endpoint",
                },
              ],
              paths: {
                "/": {
                  get: {
                    summary: "API Root",
                    responses: {
                      "200": {
                        description: "Success",
                      },
                    },
                  },
                },
              },
            },
            changelog: `Catalog import\nAuth: ${api.Auth || "None"}\nHTTPS: ${api.HTTPS}\nCORS: ${api.Cors || "Unknown"}`,
          },
        });

        await prisma.endpoint.create({
          data: {
            versionId: version.id,
            method: "GET",
            path: "/",
            description: `Access ${api.API} API`,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Error importing API ${api.API}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: "APIs imported successfully",
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Error importing APIs:", error);
    return NextResponse.json(
      {
        error: "Failed to import APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
