# Database Setup Guide

## Issue: "Cannot fetch data from service: fetch failed"

This error indicates that the database is not connected or not running. Follow these steps to set up your database:

## 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

## 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE endpointly;

# Create user (optional)
CREATE USER api_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE endpointly TO api_user;

# Exit psql
\q
```

## 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://api_user:your_password@localhost:5432/endpointly?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3001"

# OAuth (Optional - for Google/GitHub sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (Optional - for caching and rate limiting)
REDIS_URL="redis://localhost:6379"
```

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Run Database Migrations

```bash
# Push schema to database (for development)
npx prisma db push

# OR create and run migrations (for production)
npx prisma migrate dev --name init
```

## 6. Verify Database Connection

Test the connection:

```bash
# Check health endpoint
curl http://localhost:3001/api/health

# Should return:
# {"status":"healthy","database":"connected","userCount":0,...}
```

## 7. Common Issues

### Issue: "Can't reach database server"
- **Solution**: Make sure PostgreSQL is running:
  ```bash
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status postgresql
  ```

### Issue: "Authentication failed"
- **Solution**: Check your DATABASE_URL credentials match your PostgreSQL user

### Issue: "Database does not exist"
- **Solution**: Create the database (see step 2)

### Issue: "Connection refused"
- **Solution**: Check PostgreSQL is listening on the correct port (default: 5432)
  ```bash
  # macOS/Linux
  lsof -i :5432
  ```

## 8. Using Docker (Alternative)

If you prefer Docker:

```bash
# Run PostgreSQL in Docker
docker run --name endpointly-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=endpointly \
  -p 5432:5432 \
  -d postgres:14

# Update DATABASE_URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/endpointly?schema=public"
```

## 9. Reset Database (Development Only)

```bash
# WARNING: This will delete all data!
npx prisma migrate reset
```

## 10. View Database in Prisma Studio

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 to view and edit your database.
