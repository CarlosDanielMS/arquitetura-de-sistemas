// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.payment.createMany({
    data: [
      {
        orderId: 1,
        amount: 150.00,
        status: "AGUARDANDO PAGAMENTO"
      },
      {
        orderId: 2,
        amount: 320.50,
        status: "AGUARDANDO PAGAMENTO"
      },
      {
        orderId: 3,
        amount: 90.00,
        status: "AGUARDANDO PAGAMENTO"
      }
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