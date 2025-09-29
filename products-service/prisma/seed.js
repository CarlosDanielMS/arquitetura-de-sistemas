const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: "Notebook Gamer", price: 5500.0, stock: 10 },
      { name: "Monitor 27'' 144Hz", price: 1800.0, stock: 15 },
      { name: "Headset Wireless", price: 600.0, stock: 20 }
    ]
  });
}

main()
  .then(() => {
    console.log("✅ Seed executado com sucesso");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
