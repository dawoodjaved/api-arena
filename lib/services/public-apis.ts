import { prisma } from "../prisma";
import axios from "axios";

interface PublicAPI {
  API: string;
  Description: string;
  Auth: string;
  HTTPS: boolean;
  Cors: string;
  Link: string;
  Category: string;
}

interface APIsGuruEntry {
  name: string;
  description?: string;
  image?: string;
  url: string;
  openapi?: string;
  swagger?: string;
}

/**
 * Fetch public APIs from the public-apis GitHub repository
 */
export async function fetchPublicAPIsFromGitHub(): Promise<PublicAPI[]> {
  try {
    const response = await axios.get<{ entries: PublicAPI[] }>(
      "https://api.publicapis.org/entries",
      {
        timeout: 30000,
      }
    );

    if (response.data && Array.isArray(response.data.entries)) {
      return response.data.entries;
    }

    // Fallback: try direct GitHub raw URL
    const githubResponse = await axios.get<PublicAPI[]>(
      "https://raw.githubusercontent.com/public-apis/public-apis/master/entries.json",
      {
        timeout: 30000,
      }
    );

    return Array.isArray(githubResponse.data) ? githubResponse.data : [];
  } catch (error) {
    console.error("Error fetching public APIs from GitHub:", error);
    return [];
  }
}

/**
 * Fetch OpenAPI specs from APIs.guru
 */
export async function fetchAPIsFromGuru(): Promise<APIsGuruEntry[]> {
  try {
    const response = await axios.get<Record<string, APIsGuruEntry>>(
      "https://api.apis.guru/v2/list.json",
      {
        timeout: 30000,
      }
    );

    return Object.entries(response.data).map(([key, value]) => ({
      ...value,
      name: value.name || key,
    }));
  } catch (error) {
    console.error("Error fetching APIs from APIs.guru:", error);
    return [];
  }
}

/**
 * Convert public API to our API model format
 */
function convertPublicAPIToModel(api: PublicAPI, source: "github" | "guru" = "github") {
  // Create slug from API name
  const slug = api.API.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    name: api.API,
    slug: slug,
    description: api.Description || `Public API: ${api.API}`,
    category: mapCategory(api.Category),
    logo: null,
    isPublic: true,
    isApproved: true, // Auto-approve public APIs
    isFeatured: false,
    source: source,
    externalLink: api.Link,
    authType: api.Auth || "none",
    https: api.HTTPS || false,
    cors: api.Cors || "unknown",
  };
}

/**
 * Map public API categories to our categories
 */
function mapCategory(category: string): string {
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

  return categoryMap[category] || "Other";
}

/**
 * Import public APIs into the database
 */
export async function importPublicAPIs(
  userId?: string,
  limit: number = 50
): Promise<{ imported: number; skipped: number; errors: number }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Fetch from GitHub
    const githubAPIs = await fetchPublicAPIsFromGitHub();
    console.log(`Fetched ${githubAPIs.length} APIs from GitHub`);

    // Filter and limit
    const apisToImport = githubAPIs
      .filter((api) => api.API && api.Link && api.Category)
      .slice(0, limit);

    // Get or create a system user for public APIs
    let systemUserId = userId;
    if (!systemUserId) {
      const systemUser = await prisma.user.findFirst({
        where: { email: "system@apiarena.com" },
      });

      if (systemUser) {
        systemUserId = systemUser.id;
      } else {
        // Create system user if doesn't exist
        const newSystemUser = await prisma.user.create({
          data: {
            name: "System",
            email: "system@apiarena.com",
            role: "provider",
          },
        });
        systemUserId = newSystemUser.id;
      }
    }

    // Import each API
    for (const api of apisToImport) {
      try {
        const slug = api.API.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Check if API already exists
        const existing = await prisma.aPI.findUnique({
          where: { slug },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create API
        const createdAPI = await prisma.aPI.create({
          data: {
            name: api.API,
            slug: slug,
            description: api.Description || `Public API: ${api.API}`,
            category: mapCategory(api.Category),
            isPublic: true,
            isApproved: true,
            isFeatured: false,
            userId: systemUserId!,
          },
        });

        // Create a default version with basic endpoint
        await prisma.aPIVersion.create({
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
            changelog: `Imported from public-apis.org\nAuth: ${api.Auth || "None"}\nHTTPS: ${api.HTTPS}\nCORS: ${api.Cors || "Unknown"}`,
          },
        });

        // Create endpoint
        await prisma.endpoint.create({
          data: {
            versionId: (await prisma.aPIVersion.findFirst({
              where: { apiId: createdAPI.id },
            }))!.id,
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

    console.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
  } catch (error) {
    console.error("Error in importPublicAPIs:", error);
    throw error;
  }
}
