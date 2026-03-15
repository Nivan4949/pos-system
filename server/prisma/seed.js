const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create Categories
  const cat1 = await prisma.category.upsert({
    where: { name: 'Groceries' },
    update: {},
    create: { name: 'Groceries' },
  });

  const cat2 = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });

  // Create Products
  const products = [
    {
      name: 'Amul Milk 1L',
      barcode: '8901231001',
      categoryId: cat1.id,
      purchasePrice: 60,
      sellingPrice: 66,
      gstRate: 0,
      stockQuantity: 100,
    },
    {
      name: 'Aashirvaad Atta 5kg',
      barcode: '8901231002',
      categoryId: cat1.id,
      purchasePrice: 220,
      sellingPrice: 245,
      gstRate: 5,
      stockQuantity: 50,
    },
    {
      name: 'Redmi Note 12',
      barcode: '8901231003',
      categoryId: cat2.id,
      purchasePrice: 12000,
      sellingPrice: 14999,
      gstRate: 18,
      stockQuantity: 10,
    },
    {
      name: 'Sony Headphones',
      barcode: '8901231004',
      categoryId: cat2.id,
      purchasePrice: 1500,
      sellingPrice: 1999,
      gstRate: 18,
      stockQuantity: 20,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: product,
      create: product,
    });
  }
  // Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      password: 'admin123',
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  // Create Manager User
  await prisma.user.upsert({
    where: { email: 'manager' },
    update: {},
    create: {
      email: 'manager',
      password: 'manager123',
      name: 'Store Manager',
      role: 'MANAGER',
    },
  });

  // Create Cashier User
  await prisma.user.upsert({
    where: { email: 'cashier' },
    update: {},
    create: {
      email: 'cashier',
      password: 'cashier123',
      name: 'Billing Cashier',
      role: 'CASHIER',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
