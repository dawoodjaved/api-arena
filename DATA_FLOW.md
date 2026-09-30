# API Marketplace Data Flow

## 📊 Real-Time Data Source

The API marketplace **does NOT fetch data from external APIs in real-time**. Instead, it reads from your **PostgreSQL database** which stores all API information locally.

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BROWSES MARKETPLACE                    │
│                    http://localhost:3001/marketplace           │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: app/marketplace/page.tsx                             │
│  - useEffect() triggers on page load                            │
│  - Calls fetchAPIs() function                                   │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  HTTP Request: GET /api/apis?category=Data&search=weather       │
│  - Client-side fetch() call                                     │
│  - Query parameters for filtering                               │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API Route: app/api/apis/route.ts                       │
│  - GET handler receives request                                 │
│  - Extracts query parameters (category, search, featured)      │
│  - Builds Prisma query with filters                             │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database Query: Prisma ORM                                     │
│  prisma.aPI.findMany({                                          │
│    where: {                                                     │
│      isPublic: true,                                            │
│      isApproved: true,                                          │
│      category: "Data",  // if filtered                          │
│      OR: [                                                      │
│        { name: { contains: "weather" } },                      │
│        { description: { contains: "weather" } }                │
│      ]                                                          │
│    },                                                           │
│    include: {                                                   │
│      user: { select: { name, image } },                        │
│      versions: { orderBy: { createdAt: "desc" }, take: 1 },    │
│      reviews: { select: { rating } },                          │
│      _count: { select: { subscriptions: true } }              │
│    }                                                            │
│  })                                                             │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                            │
│  - API table (name, description, category, etc.)                 │
│  - APIVersion table (OpenAPI specs)                             │
│  - Review table (ratings, comments)                             │
│  - Subscription table (subscriber counts)                       │
│  - User table (provider information)                            │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Data Processing                                                │
│  - Calculate average ratings from reviews                       │
│  - Count reviews and subscriptions                             │
│  - Format response with all related data                        │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  JSON Response                                                  │
│  [                                                              │
│    {                                                            │
│      id: "...",                                                 │
│      name: "Weather API",                                       │
│      description: "...",                                       │
│      category: "Data",                                          │
│      rating: 4.5,                                               │
│      reviewCount: 10,                                            │
│      subscriberCount: 25,                                       │
│      user: { name: "System" },                                  │
│      versions: [{ version: "1.0.0", ... }]                     │
│    },                                                           │
│    ...                                                          │
│  ]                                                              │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend Updates                                                │
│  - setApis(data) updates React state                            │
│  - Component re-renders with new data                           │
│  - APICard components display each API                           │
└─────────────────────────────────────────────────────────────────┘
```

## 📍 Key Files

### Frontend (Client-Side)
- **`app/marketplace/page.tsx`** - Marketplace page component
  - Line 44: `fetch('/api/apis?${params}')` - Makes API call
  - Line 48: `setApis(data)` - Updates state with response

### Backend (Server-Side)
- **`app/api/apis/route.ts`** - API endpoint handler
  - Line 44: `prisma.aPI.findMany()` - Queries database
  - Line 87: `return NextResponse.json(apisWithStats)` - Returns JSON

### Database Layer
- **`lib/prisma.ts`** - Prisma client connection
- **`prisma/schema.prisma`** - Database schema definition

## 🗄️ Database Schema

The APIs are stored in these tables:

```prisma
model API {
  id            String        @id
  name          String
  slug          String        @unique
  description   String
  category      String
  isPublic      Boolean
  isApproved    Boolean      // Must be true to show in marketplace
  isFeatured    Boolean
  userId        String
  versions      APIVersion[]
  reviews       Review[]
  subscriptions Subscription[]
}

model APIVersion {
  id          String
  apiId       String
  version     String
  openApiSpec Json
  endpoints   Endpoint[]
}

model Review {
  id        String
  apiId     String
  userId    String
  rating    Int      // 1-5
  comment   String?
}
```

## 🔄 How APIs Get Into the Database

APIs can be added to the database in several ways:

### 1. **Manual Creation by Users**
```
User → /api-publisher/new → POST /api/apis → Database
```

### 2. **Public API Sync (Background Job)**
```
Cron Job → /api/cron/sync-apis → importPublicAPIs() → 
Fetches from public-apis.org → Stores in Database
```

### 3. **Admin Sample APIs**
```
Admin → POST /api/admin/create-sample-apis → Database
```

### 4. **OpenAPI Import**
```
User → POST /api/apis/import → Parses OpenAPI spec → Database
```

## ⚡ Real-Time Updates

The marketplace data is **NOT real-time** from external sources. It's:

- ✅ **Real-time from database** - Any changes in the database are immediately visible
- ❌ **NOT real-time from external APIs** - External API data is synced periodically

### To Get Real-Time External Data:

You would need to:
1. Set up a cron job to sync periodically
2. Use webhooks from external sources (if available)
3. Implement polling/SSE for live updates

## 🔍 Example Query Flow

When you search for "weather" in the marketplace:

1. **Frontend**: `fetch('/api/apis?search=weather')`
2. **Backend**: Builds query:
   ```typescript
   where: {
     isPublic: true,
     isApproved: true,
     OR: [
       { name: { contains: "weather", mode: "insensitive" } },
       { description: { contains: "weather", mode: "insensitive" } }
     ]
   }
   ```
3. **Database**: Executes SQL query:
   ```sql
   SELECT * FROM "API" 
   WHERE "isPublic" = true 
   AND "isApproved" = true 
   AND ("name" ILIKE '%weather%' OR "description" ILIKE '%weather%')
   ```
4. **Response**: Returns matching APIs as JSON

## 📝 Summary

- **Data Source**: PostgreSQL database (local)
- **Query Method**: Prisma ORM
- **Update Frequency**: On every page load/refresh
- **External Sync**: Background cron jobs (not real-time)
- **Performance**: Fast (local database queries)

The marketplace is essentially a **database-driven application** that displays APIs stored in your PostgreSQL database, not a live aggregator of external APIs.
