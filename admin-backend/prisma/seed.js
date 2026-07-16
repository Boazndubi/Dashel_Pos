const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@minimingle.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@minimingle.com",
      password,
      role: "ADMIN",
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "diapers-wipes" },
    update: {},
    create: {
      name: "Diapers & Wipes",
      slug: "diapers-wipes",
      description: "All diaper products",
    },
  });

  await prisma.product.upsert({
    where: { sku: "DIAPER-001" },
    update: {},
    create: {
      name: "Pampers Medium Size",
      sku: "DIAPER-001",
      basePrice: 1200,
      costPrice: 850,
      quantity: 50,
      lowStockThreshold: 10,
      categoryId: category.id,
      status: "active",
    },
  });

  console.log("Seeded admin user:", admin.email, "(password: admin123)");
  console.log("Seeded sample category + product");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
