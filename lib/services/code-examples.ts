import type { SDKLanguage } from "./sdk-generator";

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, Record<string, any>>;
  servers?: Array<{ url: string }>;
}

interface CodeExample {
  language: string;
  label: string;
  code: string;
}

/**
 * Generate code examples for all supported languages from OpenAPI spec
 */
export function generateCodeExamples(
  spec: OpenAPISpec,
  apiName: string,
  endpoint?: { method: string; path: string }
): CodeExample[] {
  const baseUrl = spec.servers?.[0]?.url || "https://api.example.com";
  const method = endpoint?.method || "GET";
  const path = endpoint?.path || Object.keys(spec.paths || {})[0] || "/";

  const examples: CodeExample[] = [];

  // JavaScript/Node.js
  examples.push({
    language: "javascript",
    label: "JavaScript (Node.js)",
    code: `const fetch = require('node-fetch');

const API_BASE_URL = '${baseUrl}';
const API_KEY = 'your-api-key-here';

async function makeRequest() {
  const response = await fetch(\`\${API_BASE_URL}${path}\`, {
    method: '${method}',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log(data);
}

makeRequest().catch(console.error);`,
  });

  // TypeScript
  examples.push({
    language: "typescript",
    label: "TypeScript",
    code: `import fetch from 'node-fetch';

const API_BASE_URL = '${baseUrl}';
const API_KEY = 'your-api-key-here';

interface ApiResponse {
  // Define your response type here
  [key: string]: any;
}

async function makeRequest(): Promise<ApiResponse> {
  const response = await fetch(\`\${API_BASE_URL}${path}\`, {
    method: '${method}',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

makeRequest().then(console.log).catch(console.error);`,
  });

  // Python
  examples.push({
    language: "python",
    label: "Python",
    code: `import requests

API_BASE_URL = '${baseUrl}'
API_KEY = 'your-api-key-here'

def make_request():
    url = f"{API_BASE_URL}${path}"
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }
    
    response = requests.${method.toLowerCase()}('${baseUrl}${path}', headers=headers)
    return response.json()

if __name__ == '__main__':
    result = make_request()
    print(result)`,
  });

  // Ruby
  examples.push({
    language: "ruby",
    label: "Ruby",
    code: `require 'net/http'
require 'json'
require 'uri'

API_BASE_URL = '${baseUrl}'
API_KEY = 'your-api-key-here'

def make_request
  uri = URI("#{API_BASE_URL}${path}")
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true if uri.scheme == 'https'
  
  request = Net::HTTP::${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}.new(uri)
  request['Authorization'] = "Bearer #{API_KEY}"
  request['Content-Type'] = 'application/json'
  
  response = http.request(request)
  JSON.parse(response.body)
end

result = make_request
puts result`,
  });

  // Go
  examples.push({
    language: "go",
    label: "Go",
    code: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const APIBaseURL = "${baseUrl}"
const APIKey = "your-api-key-here"

func makeRequest() (map[string]interface{}, error) {
    url := APIBaseURL + "${path}"
    req, err := http.NewRequest("${method}", url, nil)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Authorization", "Bearer "+APIKey)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    return result, nil
}

func main() {
    result, err := makeRequest()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result)
}`,
  });

  // PHP
  examples.push({
    language: "php",
    label: "PHP",
    code: `<?php
$apiBaseUrl = '${baseUrl}';
$apiKey = 'your-api-key-here';

function makeRequest() {
    global $apiBaseUrl, $apiKey;
    
    $url = $apiBaseUrl . '${path}';
    $ch = curl_init($url);
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => '${method}',
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return json_decode($response, true);
}

$result = makeRequest();
print_r($result);
?>`,
  });

  // Java
  examples.push({
    language: "java",
    label: "Java",
    code: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class ${apiName.replace(/[^a-zA-Z0-9]/g, "")}Example {
    private static final String API_BASE_URL = "${baseUrl}";
    private static final String API_KEY = "your-api-key-here";
    
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE_URL + "${path}"))
            .method("${method}", HttpRequest.BodyPublishers.noBody())
            .header("Authorization", "Bearer " + API_KEY)
            .header("Content-Type", "application/json")
            .build();
        
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
  });

  // C#
  examples.push({
    language: "csharp",
    label: "C#",
    code: `using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    private static readonly string ApiBaseUrl = "${baseUrl}";
    private static readonly string ApiKey = "your-api-key-here";
    
    static async Task Main(string[] args)
    {
        using (var client = new HttpClient())
        {
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {ApiKey}");
            client.DefaultRequestHeaders.Add("Content-Type", "application/json");
            
            var request = new HttpRequestMessage(new HttpMethod("${method}"), $"{ApiBaseUrl}${path}");
            var response = await client.SendAsync(request);
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine(result);
        }
    }
}`,
  });

  // Swift
  examples.push({
    language: "swift",
    label: "Swift",
    code: `import Foundation

let apiBaseURL = "${baseUrl}"
let apiKey = "your-api-key-here"

func makeRequest() async throws -> Data {
    guard let url = URL(string: apiBaseURL + "${path}") else {
        throw NSError(domain: "Invalid URL", code: 0)
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "${method}"
    request.setValue("Bearer \\(apiKey)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return data
}

Task {
    do {
        let data = try await makeRequest()
        if let json = try? JSONSerialization.jsonObject(with: data) {
            print(json)
        }
    } catch {
        print("Error: \\(error)")
    }
}`,
  });

  // Kotlin
  examples.push({
    language: "kotlin",
    label: "Kotlin",
    code: `import java.net.URL
import java.net.HttpURLConnection

val API_BASE_URL = "${baseUrl}"
val API_KEY = "your-api-key-here"

fun makeRequest(): String {
    val url = URL("$API_BASE_URL${path}")
    val connection = url.openConnection() as HttpURLConnection
    connection.requestMethod = "${method}"
    connection.setRequestProperty("Authorization", "Bearer $API_KEY")
    connection.setRequestProperty("Content-Type", "application/json")
    
    val responseCode = connection.responseCode
    return connection.inputStream.bufferedReader().use { it.readText() }
}

fun main() {
    val result = makeRequest()
    println(result)
}`,
  });

  // Rust
  examples.push({
    language: "rust",
    label: "Rust",
    code: `use reqwest;

const API_BASE_URL: &str = "${baseUrl}";
const API_KEY: &str = "your-api-key-here";

async fn make_request() -> Result<String, reqwest::Error> {
    let client = reqwest::Client::new();
    let url = format!("{}{}", API_BASE_URL, "${path}");
    
    let request = client
        .request(reqwest::Method::from_bytes("${method}".as_bytes()).unwrap(), &url)
        .header("Authorization", format!("Bearer {}", API_KEY))
        .header("Content-Type", "application/json");
    
    let response = request.send().await?;
    response.text().await
}

#[tokio::main]
async fn main() {
    match make_request().await {
        Ok(result) => println!("{}", result),
        Err(e) => println!("Error: {}", e),
    }
}`,
  });

  return examples;
}
