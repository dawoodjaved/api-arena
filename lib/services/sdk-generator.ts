export type SDKLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "ruby"
  | "go"
  | "php"
  | "java"
  | "csharp"
  | "swift"
  | "kotlin"
  | "rust";

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, any>;
  servers?: Array<{ url: string }>;
}

/**
 * Generate a lightweight single-file SDK template from the OpenAPI spec.
 * Full OpenAPI Generator is intentionally not required for the MVP.
 */
export async function generateSDK(
  openApiSpec: OpenAPISpec,
  language: SDKLanguage,
  apiName: string
): Promise<{ code: string; language: string; filename: string }> {
  const baseUrl = openApiSpec.servers?.[0]?.url || "https://api.example.com";
  const paths = openApiSpec.paths || {};
  const firstPath = Object.keys(paths)[0] || "/";
  const firstMethod = (Object.keys(paths[firstPath] || {})[0] || "get").toUpperCase();
  const safeName = apiName.replace(/[^a-zA-Z0-9]/g, "") || "Api";

  const templates: Record<SDKLanguage, string> = {
    javascript: `// ${apiName} JavaScript SDK template
const API_BASE_URL = '${baseUrl}';
const API_KEY = 'YOUR_API_KEY';

async function callAPI(endpoint, options = {}) {
  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    method: '${firstMethod}',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return response.json();
}

callAPI('${firstPath}').then(console.log).catch(console.error);
`,
    typescript: `// ${apiName} TypeScript SDK template
const API_BASE_URL = '${baseUrl}';
const API_KEY = 'YOUR_API_KEY';

async function callAPI<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    method: '${firstMethod}',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  return response.json() as Promise<T>;
}

callAPI('${firstPath}').then(console.log).catch(console.error);
`,
    python: `# ${apiName} Python SDK template
import requests

API_BASE_URL = '${baseUrl}'
API_KEY = 'YOUR_API_KEY'

def call_api(endpoint, method='${firstMethod.toLowerCase()}'):
    return requests.request(
        method,
        f'{API_BASE_URL}{endpoint}',
        headers={'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'},
    ).json()

if __name__ == '__main__':
    print(call_api('${firstPath}'))
`,
    ruby: `# ${apiName} Ruby SDK template
require 'net/http'
require 'json'
require 'uri'

API_BASE_URL = '${baseUrl}'
API_KEY = 'YOUR_API_KEY'

uri = URI("#{API_BASE_URL}${firstPath}")
req = Net::HTTP::Get.new(uri)
req['Authorization'] = "Bearer #{API_KEY}"
res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(req) }
puts JSON.parse(res.body)
`,
    go: `// ${apiName} Go SDK template
package main

import (
  "fmt"
  "io"
  "net/http"
)

func main() {
  req, _ := http.NewRequest("${firstMethod}", "${baseUrl}${firstPath}", nil)
  req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
  resp, err := http.DefaultClient.Do(req)
  if err != nil { panic(err) }
  defer resp.Body.Close()
  body, _ := io.ReadAll(resp.Body)
  fmt.Println(string(body))
}
`,
    php: `<?php
// ${apiName} PHP SDK template
$ch = curl_init('${baseUrl}${firstPath}');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Authorization: Bearer YOUR_API_KEY', 'Content-Type: application/json'],
]);
echo curl_exec($ch);
curl_close($ch);
`,
    java: `// ${apiName} Java SDK template
// Use HttpClient to GET ${baseUrl}${firstPath} with Authorization: Bearer YOUR_API_KEY
public class ${safeName}SDK {
  public static void main(String[] args) {
    System.out.println("Call ${firstMethod} ${baseUrl}${firstPath}");
  }
}
`,
    csharp: `// ${apiName} C# SDK template
// Use HttpClient to call ${baseUrl}${firstPath} with Bearer YOUR_API_KEY
Console.WriteLine("Call ${firstMethod} ${baseUrl}${firstPath}");
`,
    swift: `// ${apiName} Swift SDK template
// URLSession GET ${baseUrl}${firstPath} with Bearer YOUR_API_KEY
print("Call ${firstMethod} ${baseUrl}${firstPath}")
`,
    kotlin: `// ${apiName} Kotlin SDK template
fun main() {
  println("Call ${firstMethod} ${baseUrl}${firstPath} with Bearer YOUR_API_KEY")
}
`,
    rust: `// ${apiName} Rust SDK template
fn main() {
  println!("Call ${firstMethod} ${baseUrl}${firstPath} with Bearer YOUR_API_KEY");
}
`,
  };

  return {
    code: templates[language] || templates.javascript,
    language,
    filename: `${apiName}-${language}-example.${getFileExtension(language)}`,
  };
}

function getFileExtension(language: SDKLanguage): string {
  const extensions: Record<SDKLanguage, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    ruby: "rb",
    go: "go",
    php: "php",
    java: "java",
    csharp: "cs",
    swift: "swift",
    kotlin: "kt",
    rust: "rs",
  };
  return extensions[language] || "txt";
}
