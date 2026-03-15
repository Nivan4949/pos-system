const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current Users in DB:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Password: ${u.password}, Role: ${u.role}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
