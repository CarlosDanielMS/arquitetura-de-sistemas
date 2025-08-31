// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exists = await prisma.product.count();
  if (exists === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Mechanical Keyboard', price: 250.00, stock: 10 },
        { name: 'Gaming Mouse',       price: 150.00, stock: 8  },
      ]
    });
    console.log('Seed OK');
  } else {
    console.log('Seed pulado (já existem produtos).');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); process.exit(1); });
