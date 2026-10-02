# APIDoorway Setup Instructions

## Authentication Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# OAuth Providers (at least one required for sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OR

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env` file as `NEXTAUTH_SECRET`.

### OAuth Provider Setup

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3001/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

## Database Setup

Make sure your database is running and configured:

```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/apidoorway"

# Run migrations
npx prisma migrate dev

# Or push schema
npx prisma db push
```

## Redis Setup (Optional but Recommended)

For rate limiting and caching:

```bash
# Install Redis locally or use cloud service
REDIS_URL="redis://localhost:6379"
```

## Starting the Server

```bash
npm run dev
```

The server will start on port 3001 (or next available port).

## Sign-In Flow

1. Click "Sign In" button in navbar
2. You'll be redirected to `/auth/signin`
3. Choose Google or GitHub
4. After authentication, you'll be redirected to `/dashboard`

## Troubleshooting

### "Configuration" Error
- Check that `NEXTAUTH_SECRET` is set in `.env`
- Verify OAuth credentials are correct
- Ensure callback URLs match in OAuth provider settings

### "AccessDenied" Error
- Check database connection
- Verify Prisma schema is up to date
- Check that User model exists in database

### Database Errors
- Run `npx prisma generate` to regenerate Prisma client
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL is correct
