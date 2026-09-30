export interface TransformConfig {
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
  transformBody?: (body: any) => any;
  transformResponseBody?: (body: any) => any;
  headerInjection?: {
    request?: Record<string, string | ((headers: Headers) => string)>;
    response?: Record<string, string | ((headers: Headers) => string)>;
  };
  bodyTransformation?: {
    request?: {
      addFields?: Record<string, any>;
      removeFields?: string[];
      renameFields?: Record<string, string>;
      transformValue?: (field: string, value: any) => any;
    };
    response?: {
      addFields?: Record<string, any>;
      removeFields?: string[];
      renameFields?: Record<string, string>;
      transformValue?: (field: string, value: any) => any;
    };
  };
}

export function transformRequest(
  headers: Headers,
  body: any,
  config: TransformConfig
): { headers: Headers; body: any } {
  const newHeaders = new Headers(headers);

  // Remove headers
  if (config.removeHeaders) {
    config.removeHeaders.forEach((header) => {
      newHeaders.delete(header);
    });
  }

  // Add/transform headers
  if (config.addHeaders) {
    Object.entries(config.addHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
  }

  // Header injection with dynamic values
  if (config.headerInjection?.request) {
    Object.entries(config.headerInjection.request).forEach(([key, value]) => {
      const headerValue =
        typeof value === "function" ? value(newHeaders) : value;
      newHeaders.set(key, headerValue);
    });
  }

  // Transform body
  let newBody = body;
  if (body) {
    // Apply custom transform function
    if (config.transformBody) {
      newBody = config.transformBody(body);
    } else if (config.bodyTransformation?.request) {
      newBody = transformBodyFields(
        body,
        config.bodyTransformation.request
      );
    }
  }

  return { headers: newHeaders, body: newBody };
}

export function transformResponse(
  response: Response,
  config: TransformConfig,
  responseBody?: any
): { response: Response; body?: any } {
  const newHeaders = new Headers(response.headers);

  // Remove headers
  if (config.removeHeaders) {
    config.removeHeaders.forEach((header) => {
      newHeaders.delete(header);
    });
  }

  // Add/transform headers
  if (config.addHeaders) {
    Object.entries(config.addHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
  }

  // Header injection with dynamic values
  if (config.headerInjection?.response) {
    Object.entries(config.headerInjection.response).forEach(([key, value]) => {
      const headerValue =
        typeof value === "function" ? value(newHeaders) : value;
      newHeaders.set(key, headerValue);
    });
  }

  // Transform response body if provided
  let transformedBody = responseBody;
  if (responseBody) {
    if (config.transformResponseBody) {
      transformedBody = config.transformResponseBody(responseBody);
    } else if (config.bodyTransformation?.response) {
      transformedBody = transformBodyFields(
        responseBody,
        config.bodyTransformation.response
      );
    }
  }

  const newResponse = new Response(
    transformedBody ? JSON.stringify(transformedBody) : response.body,
    {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    }
  );

  return { response: newResponse, body: transformedBody };
}

/**
 * Transform body fields based on configuration
 */
function transformBodyFields(
  body: any,
  config: {
    addFields?: Record<string, any>;
    removeFields?: string[];
    renameFields?: Record<string, string>;
    transformValue?: (field: string, value: any) => any;
  }
): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  let transformed = Array.isArray(body) ? [...body] : { ...body };

  // Remove fields
  if (config.removeFields) {
    config.removeFields.forEach((field) => {
      if (Array.isArray(transformed)) {
        transformed = transformed.map((item) => {
          const { [field]: _, ...rest } = item;
          return rest;
        });
      } else {
        const { [field]: _, ...rest } = transformed;
        transformed = rest;
      }
    });
  }

  // Rename fields
  if (config.renameFields) {
    if (Array.isArray(transformed)) {
      transformed = transformed.map((item) => {
        const renamed: any = {};
        Object.keys(item).forEach((key) => {
          const newKey = config.renameFields![key] || key;
          renamed[newKey] = item[key];
        });
        return renamed;
      });
    } else {
      const renamed: any = {};
      Object.keys(transformed).forEach((key) => {
        const newKey = config.renameFields![key] || key;
        renamed[newKey] = transformed[key];
      });
      transformed = renamed;
    }
  }

  // Transform values
  if (config.transformValue) {
    if (Array.isArray(transformed)) {
      transformed = transformed.map((item) => {
        const transformedItem: any = {};
        Object.keys(item).forEach((key) => {
          transformedItem[key] = config.transformValue!(key, item[key]);
        });
        return transformedItem;
      });
    } else {
      const transformedObj: any = {};
      Object.keys(transformed).forEach((key) => {
        transformedObj[key] = config.transformValue!(key, transformed[key]);
      });
      transformed = transformedObj;
    }
  }

  // Add fields
  if (config.addFields) {
    if (Array.isArray(transformed)) {
      transformed = transformed.map((item) => ({
        ...item,
        ...config.addFields,
      }));
    } else {
      transformed = { ...transformed, ...config.addFields };
    }
  }

  return transformed;
}
