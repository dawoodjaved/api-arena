export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge?: number;
}

const defaultConfig: CorsConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  maxAge: 86400,
};

export function handleCors(
  origin: string | null,
  config: CorsConfig = defaultConfig
): {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Max-Age": string;
} | null {
  if (config.allowedOrigins.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": config.allowedMethods.join(", "),
      "Access-Control-Allow-Headers": config.allowedHeaders.join(", "),
      "Access-Control-Max-Age": String(config.maxAge || 86400),
    };
  }

  if (origin && config.allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": config.allowedMethods.join(", "),
      "Access-Control-Allow-Headers": config.allowedHeaders.join(", "),
      "Access-Control-Max-Age": String(config.maxAge || 86400),
    };
  }

  return null;
}
