const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: "Brayan", email: "brayan@example.com" },
      { name: "Daniel", email: "daniel@example.com" }
    ]
  });

  console.log("✅ Seed executado com sucesso");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
