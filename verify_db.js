const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();

const testConnection = async () => {
  const url = "postgresql://postgres.genbvbumxbmslhakulkz:POSFreshnaad123@db.genbvbumxbmslhakulkz.supabase.co:5432/postgres";
  console.log(`Testing Connection to: ${url?.split('@')[1]?.split('/')[0]}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: url }
    }
  });

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ SUCCESS! Database is reachable and authenticated. (Time: ${Date.now() - start}ms)`);
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    if (error.message.includes('Authentication failed')) {
      console.log('TIP: Check your password carefully. Special characters might need encoding.');
    } else if (error.message.includes('reach database server')) {
      console.log('TIP: Host is unreachable. Ensure you are using the POOLER (Port 6543) if on a restricted network.');
    }
  } finally {
    await prisma.$disconnect();
  }
};

testConnection();
