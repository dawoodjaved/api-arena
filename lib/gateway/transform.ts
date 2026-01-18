export interface TransformConfig {
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
  transformBody?: (body: any) => any;
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

  // Add headers
  if (config.addHeaders) {
    Object.entries(config.addHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
  }

  // Transform body
  let newBody = body;
  if (config.transformBody && body) {
    newBody = config.transformBody(body);
  }

  return { headers: newHeaders, body: newBody };
}

export function transformResponse(
  response: Response,
  config: TransformConfig
): Response {
  const newHeaders = new Headers(response.headers);

  // Remove headers
  if (config.removeHeaders) {
    config.removeHeaders.forEach((header) => {
      newHeaders.delete(header);
    });
  }

  // Add headers
  if (config.addHeaders) {
    Object.entries(config.addHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
