import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function logo(seed: string) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0d7377,12333a,b8d9da`;
}

function avatar(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

type SeedApi = {
  name: string;
  slug: string;
  description: string;
  category: string;
  baseUrl: string;
  featured?: boolean;
  paths: Record<string, any>;
  reviews?: Array<{ email: string; rating: number; comment: string }>;
};

const catalog: SeedApi[] = [
  {
    name: "Horizon Weather",
    slug: "horizon-weather",
    description:
      "Global weather conditions, forecasts, and historical climate data with city and geo lookup.",
    category: "Data",
    baseUrl: "https://httpbin.org",
    featured: true,
    paths: {
      "/get": {
        get: {
          summary: "Current conditions",
          responses: { "200": { description: "OK" } },
        },
      },
      "/post": {
        post: {
          summary: "Forecast query",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "dev@apiarena.local",
        rating: 5,
        comment: "Clean docs and reliable responses for weather widgets.",
      },
      {
        email: "maya@apiarena.local",
        rating: 4,
        comment: "Great coverage. Latency is solid for dashboards.",
      },
    ],
  },
  {
    name: "Ledger Pay",
    slug: "ledger-pay",
    description:
      "Payment intents, refunds, and settlement status for marketplace checkouts.",
    category: "Payment",
    baseUrl: "https://httpbin.org",
    featured: true,
    paths: {
      "/post": {
        post: {
          summary: "Create payment intent",
          responses: { "200": { description: "OK" } },
        },
      },
      "/get": {
        get: {
          summary: "Get payment status",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "jordan@apiarena.local",
        rating: 5,
        comment: "Straightforward payment flow for our SaaS billing.",
      },
    ],
  },
  {
    name: "Pulse AI Insights",
    slug: "pulse-ai",
    description:
      "Text classification, embeddings, and summarization endpoints for product AI features.",
    category: "AI/ML",
    baseUrl: "https://httpbin.org",
    featured: true,
    paths: {
      "/post": {
        post: {
          summary: "Classify text",
          responses: { "200": { description: "OK" } },
        },
      },
      "/get": {
        get: {
          summary: "Model health",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "maya@apiarena.local",
        rating: 5,
        comment: "Embeddings quality is excellent for search.",
      },
      {
        email: "dev@apiarena.local",
        rating: 4,
        comment: "Docs are clear. Would love more language samples.",
      },
    ],
  },
  {
    name: "Signal Social Graph",
    slug: "signal-social",
    description:
      "Profiles, follows, and activity feeds for social products and community apps.",
    category: "Social",
    baseUrl: "https://httpbin.org",
    paths: {
      "/get": {
        get: {
          summary: "Fetch profile",
          responses: { "200": { description: "OK" } },
        },
      },
      "/post": {
        post: {
          summary: "Create activity",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "jordan@apiarena.local",
        rating: 4,
        comment: "Useful graph endpoints for our community MVP.",
      },
    ],
  },
  {
    name: "Relay Notify",
    slug: "relay-notify",
    description:
      "Transactional email, SMS, and push delivery with templates and delivery receipts.",
    category: "Communication",
    baseUrl: "https://httpbin.org",
    featured: true,
    paths: {
      "/post": {
        post: {
          summary: "Send notification",
          responses: { "200": { description: "OK" } },
        },
      },
      "/get": {
        get: {
          summary: "Delivery status",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "dev@apiarena.local",
        rating: 5,
        comment: "Templates + receipts made onboarding email easy.",
      },
    ],
  },
  {
    name: "Atlas Geo",
    slug: "atlas-geo",
    description:
      "Geocoding, reverse geocoding, and distance matrix for maps and logistics.",
    category: "Data",
    baseUrl: "https://httpbin.org",
    paths: {
      "/get": {
        get: {
          summary: "Geocode address",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "maya@apiarena.local",
        rating: 4,
        comment: "Accurate enough for store locator use cases.",
      },
    ],
  },
  {
    name: "Vault Storage",
    slug: "vault-storage",
    description:
      "Signed upload URLs, object metadata, and lifecycle policies for file storage.",
    category: "Storage",
    baseUrl: "https://httpbin.org",
    paths: {
      "/post": {
        post: {
          summary: "Create upload URL",
          responses: { "200": { description: "OK" } },
        },
      },
      "/get": {
        get: {
          summary: "Object metadata",
          responses: { "200": { description: "OK" } },
        },
      },
    },
  },
  {
    name: "Meter Analytics",
    slug: "meter-analytics",
    description:
      "Event ingest, funnels, and retention queries for product analytics.",
    category: "Analytics",
    baseUrl: "https://httpbin.org",
    paths: {
      "/post": {
        post: {
          summary: "Ingest events",
          responses: { "200": { description: "OK" } },
        },
      },
      "/get": {
        get: {
          summary: "Query funnel",
          responses: { "200": { description: "OK" } },
        },
      },
    },
    reviews: [
      {
        email: "jordan@apiarena.local",
        rating: 5,
        comment: "Event schema is flexible without being messy.",
      },
    ],
  },
];

async function upsertUser(opts: {
  email: string;
  name: string;
  role: string;
  password: string;
  image?: string;
}) {
  const hashed = await bcrypt.hash(opts.password, 10);
  const user = await prisma.user.upsert({
    where: { email: opts.email },
    update: {
      role: opts.role,
      name: opts.name,
      image: opts.image,
    },
    create: {
      email: opts.email,
      name: opts.name,
      role: opts.role,
      image: opts.image,
    },
  });

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, provider: "credentials" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { access_token: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
        access_token: hashed,
      },
    });
  }

  return user;
}

async function upsertApi(providerId: string, item: SeedApi) {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: item.name,
      version: "1.0.0",
      description: item.description,
    },
    servers: [{ url: item.baseUrl }],
    paths: item.paths,
  };

  const api = await prisma.aPI.upsert({
    where: { slug: item.slug },
    update: {
      name: item.name,
      description: item.description,
      category: item.category,
      logo: logo(item.slug),
      baseUrl: item.baseUrl,
      isPublic: true,
      isApproved: true,
      isFeatured: Boolean(item.featured),
      userId: providerId,
    },
    create: {
      name: item.name,
      slug: item.slug,
      description: item.description,
      category: item.category,
      logo: logo(item.slug),
      baseUrl: item.baseUrl,
      isPublic: true,
      isApproved: true,
      isFeatured: Boolean(item.featured),
      userId: providerId,
    },
  });

  let version = await prisma.aPIVersion.findFirst({
    where: { apiId: api.id, version: "1.0.0" },
  });

  if (!version) {
    version = await prisma.aPIVersion.create({
      data: {
        apiId: api.id,
        version: "1.0.0",
        openApiSpec,
        changelog: `Initial release of ${item.name}.`,
      },
    });
  } else {
    version = await prisma.aPIVersion.update({
      where: { id: version.id },
      data: { openApiSpec, changelog: `Initial release of ${item.name}.` },
    });
    await prisma.endpoint.deleteMany({ where: { versionId: version.id } });
  }

  const endpoints: Array<{ method: string; path: string; description?: string }> =
    [];
  for (const [path, methods] of Object.entries(item.paths)) {
    for (const [method, op] of Object.entries(methods as Record<string, any>)) {
      endpoints.push({
        method: method.toUpperCase(),
        path,
        description: op?.summary,
      });
    }
  }

  if (endpoints.length) {
    await prisma.endpoint.createMany({
      data: endpoints.map((e) => ({
        versionId: version!.id,
        method: e.method,
        path: e.path,
        description: e.description,
      })),
    });
  }

  return api;
}

async function main() {
  const admin = await upsertUser({
    email: "admin@apiarena.local",
    name: "Alex Rivera",
    role: "admin",
    password: "admin123",
    image: avatar("alex-rivera"),
  });

  const provider = await upsertUser({
    email: "provider@apiarena.local",
    name: "Nova Labs",
    role: "provider",
    password: "provider123",
    image: avatar("nova-labs"),
  });

  const reviewers = await Promise.all([
    upsertUser({
      email: "dev@apiarena.local",
      name: "Sam Chen",
      role: "user",
      password: "user1234",
      image: avatar("sam-chen"),
    }),
    upsertUser({
      email: "maya@apiarena.local",
      name: "Maya Okonkwo",
      role: "user",
      password: "user1234",
      image: avatar("maya-okonkwo"),
    }),
    upsertUser({
      email: "jordan@apiarena.local",
      name: "Jordan Lee",
      role: "user",
      password: "user1234",
      image: avatar("jordan-lee"),
    }),
  ]);

  const reviewerByEmail = Object.fromEntries(
    reviewers.map((u) => [u.email, u])
  );

  // Keep old demo slug working by aliasing to horizon-weather content
  await prisma.aPI.deleteMany({ where: { slug: "demo-weather" } }).catch(() => {});

  for (const item of catalog) {
    const api = await upsertApi(provider.id, item);

    for (const review of item.reviews || []) {
      const user = reviewerByEmail[review.email];
      if (!user) continue;
      await prisma.review.upsert({
        where: {
          userId_apiId: { userId: user.id, apiId: api.id },
        },
        update: {
          rating: review.rating,
          comment: review.comment,
        },
        create: {
          userId: user.id,
          apiId: api.id,
          rating: review.rating,
          comment: review.comment,
        },
      });
    }

    // Free-tier style subscription for first reviewer (keys / usage demos)
    const subscriber = reviewers[0];
    await prisma.subscription.upsert({
      where: {
        userId_apiId: { userId: subscriber.id, apiId: api.id },
      },
      update: {
        plan: "free",
        status: "active",
        stripeCustomerId: `cus_seed_${subscriber.id.slice(0, 8)}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: subscriber.id,
        apiId: api.id,
        plan: "free",
        status: "active",
        stripeCustomerId: `cus_seed_${subscriber.id.slice(0, 8)}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    apis: await prisma.aPI.count(),
    reviews: await prisma.review.count(),
    versions: await prisma.aPIVersion.count(),
    endpoints: await prisma.endpoint.count(),
  };

  console.log("Seed complete with polished catalog.");
  console.log(counts);
  console.log("Logins:");
  console.log("  admin@apiarena.local / admin123");
  console.log("  provider@apiarena.local / provider123");
  console.log("  dev@apiarena.local / user1234");
  console.log("Admin id:", admin.id);
  console.log("Provider:", provider.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
