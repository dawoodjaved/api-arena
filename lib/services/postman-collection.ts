interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, Record<string, any>>;
  servers?: Array<{ url: string }>;
  components?: {
    securitySchemes?: Record<string, any>;
  };
}

interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanItem[];
  variable?: Array<{ key: string; value: string }>;
  auth?: {
    type: string;
    [key: string]: any;
  };
}

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string }>;
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string }>;
    };
    body?: {
      mode: string;
      raw?: string;
      [key: string]: any;
    };
  };
  response?: any[];
}

/**
 * Convert OpenAPI spec to Postman Collection v2.1
 */
export function convertToPostmanCollection(
  spec: OpenAPISpec,
  apiName: string,
  baseUrl?: string
): PostmanCollection {
  const apiBaseUrl = baseUrl || spec.servers?.[0]?.url || "https://api.example.com";
  const paths = spec.paths || {};
  const items: PostmanItem[] = [];

  // Extract auth scheme
  const authScheme = spec.components?.securitySchemes
    ? Object.values(spec.components.securitySchemes)[0]
    : null;

  // Process each path
  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods !== "object" || methods === null) continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (!["get", "post", "put", "delete", "patch", "head", "options"].includes(method.toLowerCase())) {
        continue;
      }

      const op = operation as any;
      const itemName = op.summary || op.operationId || `${method.toUpperCase()} ${path}`;

      // Parse URL
      const urlParts = new URL(apiBaseUrl);
      const pathSegments = path.split("/").filter(Boolean);

      // Extract query parameters from OpenAPI spec
      const queryParams: Array<{ key: string; value: string }> = [];
      if (op.parameters) {
        for (const param of op.parameters) {
          if (param.in === "query") {
            queryParams.push({
              key: param.name,
              value: param.schema?.default || `{{${param.name}}}`,
            });
          }
        }
      }

      // Build headers
      const headers: Array<{ key: string; value: string }> = [
        { key: "Content-Type", value: "application/json" },
      ];

      // Add auth header if Bearer token
      if (authScheme?.type === "http" && authScheme.scheme === "bearer") {
        headers.push({
          key: "Authorization",
          value: "Bearer {{apiKey}}",
        });
      } else if (authScheme?.type === "apiKey" && authScheme.in === "header") {
        headers.push({
          key: authScheme.name,
          value: `{{${authScheme.name}}}`,
        });
      }

      // Build request body if needed
      let body: PostmanItem["request"]["body"] | undefined;
      if (["post", "put", "patch"].includes(method.toLowerCase())) {
        const requestBody = op.requestBody;
        if (requestBody?.content?.["application/json"]?.schema) {
          const schema = requestBody.content["application/json"].schema;
          const example = generateExampleFromSchema(schema);
          body = {
            mode: "raw",
            raw: JSON.stringify(example, null, 2),
            options: {
              raw: {
                language: "json",
              },
            },
          };
        } else {
          body = {
            mode: "raw",
            raw: "{}",
            options: {
              raw: {
                language: "json",
              },
            },
          };
        }
      }

      const item: PostmanItem = {
        name: itemName,
        request: {
          method: method.toUpperCase(),
          header: headers,
          url: {
            raw: `${apiBaseUrl}${path}${queryParams.length > 0 ? "?" + queryParams.map(p => `${p.key}=${p.value}`).join("&") : ""}`,
            host: urlParts.hostname ? [urlParts.hostname] : [],
            path: pathSegments,
            ...(queryParams.length > 0 && { query: queryParams }),
          },
          ...(body && { body }),
        },
      };

      items.push(item);
    }
  }

  // Build collection
  const collection: PostmanCollection = {
    info: {
      name: `${apiName} API Collection`,
      description: spec.info?.description || `Postman collection for ${apiName}`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
    variable: [
      { key: "baseUrl", value: apiBaseUrl },
      { key: "apiKey", value: "your-api-key-here" },
    ],
  };

  // Add collection-level auth if applicable
  if (authScheme?.type === "http" && authScheme.scheme === "bearer") {
    collection.auth = {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: "{{apiKey}}",
          type: "string",
        },
      ],
    };
  } else if (authScheme?.type === "apiKey") {
    if (authScheme.in === "header") {
      collection.auth = {
        type: "apikey",
        apikey: [
          { key: "key", value: authScheme.name, type: "string" },
          { key: "value", value: `{{${authScheme.name}}}`, type: "string" },
          { key: "in", value: "header", type: "string" },
        ],
      };
    }
  }

  return collection;
}

/**
 * Generate example JSON from JSON Schema
 */
function generateExampleFromSchema(schema: any): any {
  if (!schema) return {};

  // Handle type
  if (schema.type === "object") {
    const example: any = {};
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
        example[key] = generateExampleFromSchema(prop);
      }
    }
    return example;
  }

  if (schema.type === "array") {
    if (schema.items) {
      return [generateExampleFromSchema(schema.items)];
    }
    return [];
  }

  if (schema.type === "string") {
    if (schema.example) return schema.example;
    if (schema.format === "date-time") return new Date().toISOString();
    if (schema.format === "email") return "user@example.com";
    if (schema.format === "uri") return "https://example.com";
    return "string";
  }

  if (schema.type === "number" || schema.type === "integer") {
    if (schema.example !== undefined) return schema.example;
    return schema.type === "integer" ? 0 : 0.0;
  }

  if (schema.type === "boolean") {
    return schema.example !== undefined ? schema.example : false;
  }

  if (schema.type === "null") {
    return null;
  }

  // Handle enum
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Handle oneOf, anyOf, allOf
  if (schema.oneOf && schema.oneOf.length > 0) {
    return generateExampleFromSchema(schema.oneOf[0]);
  }
  if (schema.anyOf && schema.anyOf.length > 0) {
    return generateExampleFromSchema(schema.anyOf[0]);
  }
  if (schema.allOf && schema.allOf.length > 0) {
    return generateExampleFromSchema(schema.allOf[0]);
  }

  return null;
}
