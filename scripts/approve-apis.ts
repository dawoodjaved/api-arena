import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.aPI.updateMany({
    data: { isApproved: true, isPublic: true },
  });

  const featured = await prisma.aPI.updateMany({
    where: { slug: "demo-weather" },
    data: { isFeatured: true, baseUrl: "https://httpbin.org" },
  });

  const apis = await prisma.aPI.findMany({
    select: {
      slug: true,
      name: true,
      isApproved: true,
      isFeatured: true,
      baseUrl: true,
    },
  });
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
  });

  console.log("Approved APIs:", updated.count);
  console.log("Featured demo:", featured.count);
  console.log(apis);
  console.log(users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
