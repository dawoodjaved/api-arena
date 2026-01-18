import axios from "axios";

interface KongConfig {
  adminUrl: string;
  apiUrl: string;
  apiKey?: string;
}

interface KongService {
  name: string;
  url: string;
  protocol?: string;
  host?: string;
  port?: number;
  path?: string;
  retries?: number;
  connect_timeout?: number;
  write_timeout?: number;
  read_timeout?: number;
}

interface KongRoute {
  name: string;
  service: { id: string };
  paths: string[];
  methods?: string[];
  strip_path?: boolean;
  preserve_host?: boolean;
}

/**
 * Kong Gateway integration
 * This provides a wrapper around Kong Gateway API for better performance
 * Falls back to custom gateway if Kong is not available
 */
export class KongGateway {
  private config: KongConfig;
  private enabled: boolean;

  constructor(config?: Partial<KongConfig>) {
    this.config = {
      adminUrl: process.env.KONG_ADMIN_URL || "http://localhost:8001",
      apiUrl: process.env.KONG_API_URL || "http://localhost:8000",
      apiKey: process.env.KONG_API_KEY,
      ...config,
    };
    this.enabled = !!process.env.KONG_ENABLED && process.env.KONG_ENABLED === "true";
  }

  /**
   * Check if Kong Gateway is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const response = await axios.get(`${this.config.adminUrl}/status`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.warn("Kong Gateway not available, using fallback:", error);
      return false;
    }
  }

  /**
   * Create or update a service in Kong
   */
  async createService(service: KongService): Promise<any> {
    if (!this.enabled) {
      throw new Error("Kong Gateway is not enabled");
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Kong-Admin-Token"] = this.config.apiKey;
      }

      // Check if service exists
      try {
        const existing = await axios.get(
          `${this.config.adminUrl}/services/${service.name}`,
          { headers, timeout: 5000 }
        );
        
        // Update existing service
        const response = await axios.patch(
          `${this.config.adminUrl}/services/${service.name}`,
          service,
          { headers, timeout: 5000 }
        );
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Create new service
          const response = await axios.post(
            `${this.config.adminUrl}/services`,
            service,
            { headers, timeout: 5000 }
          );
          return response.data;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error creating Kong service:", error);
      throw error;
    }
  }

  /**
   * Create or update a route in Kong
   */
  async createRoute(route: KongRoute): Promise<any> {
    if (!this.enabled) {
      throw new Error("Kong Gateway is not enabled");
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Kong-Admin-Token"] = this.config.apiKey;
      }

      // Check if route exists
      try {
        const existing = await axios.get(
          `${this.config.adminUrl}/routes/${route.name}`,
          { headers, timeout: 5000 }
        );
        
        // Update existing route
        const response = await axios.patch(
          `${this.config.adminUrl}/routes/${route.name}`,
          route,
          { headers, timeout: 5000 }
        );
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Create new route
          const response = await axios.post(
            `${this.config.adminUrl}/routes`,
            route,
            { headers, timeout: 5000 }
          );
          return response.data;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error creating Kong route:", error);
      throw error;
    }
  }

  /**
   * Enable rate limiting plugin for a service
   */
  async enableRateLimit(serviceName: string, config: {
    minute?: number;
    hour?: number;
    day?: number;
  }): Promise<any> {
    if (!this.enabled) {
      throw new Error("Kong Gateway is not enabled");
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Kong-Admin-Token"] = this.config.apiKey;
      }

      const pluginConfig = {
        name: "rate-limiting",
        config: {
          minute: config.minute || 60,
          hour: config.hour || 1000,
          day: config.day || 10000,
          policy: "local", // Use Redis if available: "redis"
        },
      };

      const response = await axios.post(
        `${this.config.adminUrl}/services/${serviceName}/plugins`,
        pluginConfig,
        { headers, timeout: 5000 }
      );

      return response.data;
    } catch (error) {
      console.error("Error enabling rate limit:", error);
      throw error;
    }
  }

  /**
   * Enable authentication plugin (API key) for a service
   */
  async enableApiKeyAuth(serviceName: string): Promise<any> {
    if (!this.enabled) {
      throw new Error("Kong Gateway is not enabled");
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Kong-Admin-Token"] = this.config.apiKey;
      }

      const pluginConfig = {
        name: "key-auth",
        config: {
          key_names: ["X-API-Key", "apikey"],
          hide_credentials: false,
        },
      };

      const response = await axios.post(
        `${this.config.adminUrl}/services/${serviceName}/plugins`,
        pluginConfig,
        { headers, timeout: 5000 }
      );

      return response.data;
    } catch (error) {
      console.error("Error enabling API key auth:", error);
      throw error;
    }
  }

  /**
   * Get the public API URL for a service
   */
  getApiUrl(serviceName: string, path: string = ""): string {
    if (!this.enabled) {
      return `${this.config.apiUrl}/${serviceName}${path}`;
    }
    return `${this.config.apiUrl}/${serviceName}${path}`;
  }
}

// Singleton instance
let kongInstance: KongGateway | null = null;

export function getKongGateway(): KongGateway {
  if (!kongInstance) {
    kongInstance = new KongGateway();
  }
  return kongInstance;
}
