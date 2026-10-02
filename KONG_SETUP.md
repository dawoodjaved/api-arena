# Kong Gateway Setup Guide

Kong Gateway provides better performance, security, and scalability for API routing. This guide shows how to integrate Kong with APIDoorway.

## What is Kong Gateway?

Kong is an open-source API gateway that provides:
- **High Performance**: Handles millions of requests per second
- **Rate Limiting**: Built-in rate limiting with Redis support
- **Authentication**: Multiple auth plugins (API keys, OAuth, JWT)
- **Caching**: Response caching to reduce backend load
- **Load Balancing**: Distribute traffic across multiple backends
- **Monitoring**: Built-in analytics and logging

## Quick Start (Docker)

The easiest way to run Kong is with Docker:

```bash
# 1. Create Docker network
docker network create kong-net

# 2. Start PostgreSQL (Kong's database)
docker run -d --name kong-database \
  --network=kong-net \
  -p 5432:5432 \
  -e "POSTGRES_USER=kong" \
  -e "POSTGRES_PASSWORD=kong" \
  -e "POSTGRES_DB=kong" \
  postgres:13

# 3. Run Kong migrations
docker run --rm \
  --network=kong-net \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-database" \
  -e "KONG_PG_USER=kong" \
  -e "KONG_PG_PASSWORD=kong" \
  -e "KONG_PG_DATABASE=kong" \
  kong:latest kong migrations bootstrap

# 4. Start Kong
docker run -d --name kong \
  --network=kong-net \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-database" \
  -e "KONG_PG_USER=kong" \
  -e "KONG_PG_PASSWORD=kong" \
  -e "KONG_PG_DATABASE=kong" \
  -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
  -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
  -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
  -p 8000:8000 \
  -p 8443:8443 \
  -p 8001:8001 \
  -p 8444:8444 \
  kong:latest
```

## Configuration

Add these environment variables to your `.env` file:

```env
# Kong Gateway Configuration
KONG_ENABLED=true
KONG_ADMIN_URL=http://localhost:8001
KONG_API_URL=http://localhost:8000
KONG_API_KEY=your-kong-admin-token-here  # Optional but recommended
```

## How It Works

1. **Automatic Detection**: The gateway automatically detects if Kong is available
2. **Fallback**: If Kong is not available, it falls back to the custom gateway
3. **Service Registration**: When an API is published, it can be registered with Kong
4. **Route Management**: Kong handles routing, rate limiting, and caching

## Manual Service Registration

You can manually register APIs with Kong using the admin API:

```bash
# Create a service
curl -i -X POST http://localhost:8001/services/ \
  --data "name=my-api" \
  --data "url=http://api.example.com"

# Create a route
curl -i -X POST http://localhost:8001/services/my-api/routes \
  --data "paths[]=/my-api"

# Enable rate limiting
curl -i -X POST http://localhost:8001/services/my-api/plugins \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.hour=1000"
```

## Using Kong with Redis (Recommended)

For better performance, use Redis for rate limiting:

```bash
# Start Redis
docker run -d --name redis \
  --network=kong-net \
  -p 6379:6379 \
  redis:7-alpine

# Update Kong configuration
docker run -d --name kong \
  --network=kong-net \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-database" \
  -e "KONG_REDIS_HOST=redis" \
  -e "KONG_PLUGINS=bundled,rate-limiting-advanced" \
  -p 8000:8000 \
  -p 8001:8001 \
  kong:latest
```

## Production Deployment

For production, consider:
- Using Kong Enterprise (paid) for advanced features
- Setting up Kong with Kubernetes
- Using Kong Cloud (managed service)
- Configuring SSL/TLS certificates
- Setting up monitoring and alerting

## Testing Kong Integration

1. Start Kong (see Quick Start above)
2. Set `KONG_ENABLED=true` in `.env`
3. Restart your Next.js server
4. Check health: `curl http://localhost:8001/status`
5. Test API through Kong: `curl http://localhost:8000/your-api/endpoint`

## Troubleshooting

**Kong not starting:**
- Check PostgreSQL is running
- Verify network connectivity
- Check Kong logs: `docker logs kong`

**Services not registering:**
- Verify `KONG_ENABLED=true`
- Check Kong admin URL is accessible
- Review application logs for errors

**Rate limiting not working:**
- Ensure Redis is configured (for better performance)
- Check plugin is enabled on service
- Verify rate limit configuration

## Resources

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Docker Hub](https://hub.docker.com/_/kong)
- [Kong Plugins](https://docs.konghq.com/hub/)
