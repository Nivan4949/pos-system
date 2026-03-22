const { PrismaClient } = require('@prisma/client');

// Verified connection string from local environment to ensure production stability
const VERCEL_DB_URL = "postgresql://postgres.genbvbumxbmslhakulkz:POSFreshnaad123@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&statement_cache_size=0";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.includes('pooler') ? process.env.DATABASE_URL : VERCEL_DB_URL
    }
  }
});

module.exports = prisma;
