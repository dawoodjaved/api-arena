/**
 * Marketplace data sources: open-source API catalogs so users can discover APIs,
 * try them in the playground, and read documentation.
 *
 * Sources:
 * - GitHub: https://github.com/public-apis/public-apis (entries.json)
 * - api.publicapis.org (mirror of the above)
 * - APIs.guru: https://api.apis.guru/v2/list.json (OpenAPI-focused directory)
 */
import { prisma } from "../prisma";
import axios from "axios";

// Use native fetch if available (Node 18+), otherwise fallback to axios
const fetchAPIData = async (url: string, options: any = {}) => {
  // Try native fetch first (Node 18+)
  if (typeof fetch !== 'undefined') {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'APIArena/1.0',
          ...options.headers,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (fetchError: any) {
      console.warn(`Native fetch failed: ${fetchError.message}, trying axios...`);
      // Fall through to axios
    }
  }
  // Fallback to axios
  const response = await axios.get(url, {
    timeout: options.timeout || 60000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'APIArena/1.0',
      ...options.headers,
    },
  });
  return response.data;
};

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
 * Fetch public APIs from GitHub repository: https://github.com/public-apis/public-apis
 * Uses GitHub API to fetch the repository data
 */
export async function fetchPublicAPIsFromGitHub(): Promise<PublicAPI[]> {
  try {
    console.log("Fetching APIs from GitHub repository: public-apis/public-apis...");
    
    // Try GitHub API first (more reliable)
    const githubApiUrl = "https://api.github.com/repos/public-apis/public-apis/contents/entries.json";
    const githubRawUrl = "https://raw.githubusercontent.com/public-apis/public-apis/master/entries.json";
    
    // Method 1: Try GitHub API to get file content
    if (typeof fetch !== 'undefined') {
      try {
        console.log("Trying GitHub API...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        // Try GitHub API first
        let response = await fetch(githubApiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'APIArena/1.0',
          },
        });
        
        // If GitHub API fails, try raw URL
        if (!response.ok) {
          console.log("GitHub API failed, trying raw GitHub URL...");
          response = await fetch(githubRawUrl, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'APIArena/1.0',
            },
          });
        }
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`GitHub fetch: Response received. Type: ${typeof data}, IsArray: ${Array.isArray(data)}`);

        if (data && typeof data === 'object') {
          if (Array.isArray(data.entries)) {
            console.log(`Successfully fetched ${data.entries.length} APIs from GitHub (format: {entries})`);
            return data.entries;
          }
          if (Array.isArray(data)) {
            console.log(`Successfully fetched ${data.length} APIs from GitHub (format: direct array)`);
            return data;
          }
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.warn("GitHub fetch timeout, trying api.publicapis.org...");
        } else {
          console.warn(`GitHub fetch failed: ${fetchError.message}, trying api.publicapis.org...`);
        }
      }
    }
    
    // Method 2: Fallback to api.publicapis.org (the API endpoint that serves the GitHub data)
    try {
      console.log("Trying api.publicapis.org endpoint...");
      const response = await axios.get(
        "https://api.publicapis.org/entries",
        {
          timeout: 60000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'APIArena/1.0',
          },
        }
      );

      const data = response.data;
      console.log(`API endpoint: Response received. Type: ${typeof data}, IsArray: ${Array.isArray(data)}`);

      if (data && typeof data === 'object') {
        if (Array.isArray(data.entries)) {
          console.log(`Successfully fetched ${data.entries.length} APIs from api.publicapis.org (format: {entries})`);
          return data.entries;
        }
        if (Array.isArray(data)) {
          console.log(`Successfully fetched ${data.length} APIs from api.publicapis.org (format: direct array)`);
          return data;
        }
      }
    } catch (apiError: any) {
      console.warn(`api.publicapis.org also failed: ${apiError.message}`);
    }
    
    // Method 3: Try axios with GitHub raw URL
    try {
      console.log("Trying axios with GitHub raw URL...");
      const response = await axios.get(githubRawUrl, {
        timeout: 60000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'APIArena/1.0',
        },
      });

      const data = response.data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.entries)) {
          console.log(`Successfully fetched ${data.entries.length} APIs from GitHub raw URL`);
          return data.entries;
        }
        if (Array.isArray(data)) {
          console.log(`Successfully fetched ${data.length} APIs from GitHub raw URL`);
          return data;
        }
      }
    } catch (githubError: any) {
      console.warn(`GitHub raw URL failed: ${githubError.message}`);
    }

    console.error("All fetch methods failed");
    return [];
  } catch (error: any) {
    console.error("Error fetching public APIs:", error.message);
    if (error.response) {
      console.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    }
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    return [];
  }
}

/**
 * Fetch OpenAPI specs from APIs.guru (https://api.apis.guru/v2/list.json).
 * Returns name, description, url, openapi/swagger URLs for documentation.
 */
export async function fetchAPIsFromGuru(): Promise<APIsGuruEntry[]> {
  try {
    const response = await axios.get<Record<string, APIsGuruEntry>>(
      "https://api.apis.guru/v2/list.json",
      {
        timeout: 60000,
        headers: { "Accept": "application/json", "User-Agent": "APIArena/1.0" },
      }
    );

    const data = response.data;
    if (!data || typeof data !== "object") return [];

    // APIs.guru shape: { "api-key": { name?, description?, url, openapi?, swagger?, ... } }
    return Object.entries(data).map(([key, value]) => ({
      name: (value as { name?: string }).name || key,
      description: (value as { description?: string }).description,
      image: (value as { image?: string }).image,
      url: (value as { url?: string }).url || "",
      openapi: (value as { openapi?: string }).openapi,
      swagger: (value as { swagger?: string }).swagger,
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

/** Get or create the system user used for imported public APIs. */
async function getOrCreateSystemUser(userId?: string): Promise<string> {
  if (userId) return userId;
  const systemUser = await prisma.user.findFirst({
    where: { email: "system@apiarena.com" },
  });
  if (systemUser) return systemUser.id;
  const newUser = await prisma.user.create({
    data: {
      name: "System",
      email: "system@apiarena.com",
      role: "provider",
    },
  });
  return newUser.id;
}

/**
 * Import APIs from APIs.guru into the database.
 * APIs.guru provides OpenAPI/Swagger URLs for better documentation.
 */
export async function importFromAPIsGuru(
  userId?: string,
  limit: number = 50
): Promise<{ imported: number; skipped: number; errors: number }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const guruAPIs = await fetchAPIsFromGuru();
    console.log(`Fetched ${guruAPIs.length} APIs from APIs.guru`);

    if (guruAPIs.length === 0) {
      return { imported: 0, skipped: 0, errors: 0 };
    }

    const valid = guruAPIs.filter((a) => a.name && a.name.trim() && a.url && a.url.trim());
    const toImport = valid.slice(0, limit);
    const systemUserId = await getOrCreateSystemUser(userId);

    for (const api of toImport) {
      try {
        const slug = api.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 100);
        if (!slug) {
          skipped++;
          continue;
        }

        const existing = await prisma.aPI.findUnique({ where: { slug } });
        if (existing) {
          skipped++;
          continue;
        }

        const name = api.name.trim().substring(0, 200);
        const description = (api.description || `API: ${name}`).trim().substring(0, 2000);

        await prisma.aPI.create({
          data: {
            name,
            slug,
            description,
            category: "Other",
            logo: api.image || null,
            isPublic: true,
            isApproved: true,
            isFeatured: false,
            userId: systemUserId,
          },
        });

        const created = await prisma.aPI.findUnique({ where: { slug } });
        if (!created) continue;

        const specUrl = api.openapi || api.swagger || "";
        await prisma.aPIVersion.create({
          data: {
            apiId: created.id,
            version: "1.0.0",
            openApiSpec: {
              openapi: "3.0.0",
              info: { title: name, description, version: "1.0.0" },
              servers: [{ url: api.url, description: "API base URL" }],
              paths: {},
            },
            changelog: specUrl
              ? `Imported from APIs.guru. OpenAPI spec: ${specUrl}`
              : "Imported from APIs.guru",
          },
        });

        const version = await prisma.aPIVersion.findFirst({
          where: { apiId: created.id },
        });
        if (version) {
          await prisma.endpoint.create({
            data: {
              versionId: version.id,
              method: "GET",
              path: "/",
              description: `Base URL: ${api.url}`,
            },
          });
        }

        imported++;
      } catch (err) {
        console.error(`Error importing ${api.name} from APIs.guru:`, err);
        errors++;
      }
    }

    console.log(`APIs.guru import: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    return { imported, skipped, errors };
  } catch (error) {
    console.error("Error in importFromAPIsGuru:", error);
    throw error;
  }
}

/**
 * Import public APIs into the database (GitHub public-apis/public-apis + api.publicapis.org).
 */
export async function importPublicAPIs(
  userId?: string,
  limit: number = 50
): Promise<{ imported: number; skipped: number; errors: number }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Fetch from publicapis.org
    const publicAPIs = await fetchPublicAPIsFromGitHub();
    console.log(`Fetched ${publicAPIs.length} APIs from publicapis.org`);

    if (publicAPIs.length === 0) {
      console.warn("No APIs fetched. Check your internet connection and API availability.");
      return { imported: 0, skipped: 0, errors: 0 };
    }

    // Filter valid APIs (must have name, link, and category)
    const validAPIs = publicAPIs.filter(
      (api) => api.API && api.API.trim() && api.Link && api.Link.trim() && api.Category
    );
    console.log(`Found ${validAPIs.length} valid APIs out of ${publicAPIs.length} total`);

    // Limit the number to import
    const apisToImport = validAPIs.slice(0, limit);
    console.log(`Importing ${apisToImport.length} APIs (limit: ${limit})`);

    const systemUserId = await getOrCreateSystemUser(userId);

    // Import each API
    for (const api of apisToImport) {
      try {
        // Clean and create slug
        const slug = api.API.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 100); // Limit slug length

        if (!slug) {
          console.warn(`Skipping API with invalid name: ${api.API}`);
          skipped++;
          continue;
        }

        // Check if API already exists
        const existing = await prisma.aPI.findUnique({
          where: { slug },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create API with proper data validation
        const apiName = api.API.trim().substring(0, 200); // Limit name length
        const apiDescription = (api.Description || `Public API: ${apiName}`)
          .trim()
          .substring(0, 2000); // Limit description length
        const apiCategory = mapCategory(api.Category);

        // Create API
        const createdAPI = await prisma.aPI.create({
          data: {
            name: apiName,
            slug: slug,
            description: apiDescription,
            category: apiCategory,
            isPublic: true,
            isApproved: true, // Auto-approve public APIs
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
