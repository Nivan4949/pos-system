const { PrismaClient } = require('@prisma/client');

// Multi-strategy connection fallback for Vercel
const getDbUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  
  // If user provided a pooler URL in Vercel, use it
  if (envUrl.includes('pooler')) return envUrl;

  // Otherwise, use our verified fallback with the LATEST password provided by the user
  const password = "admin123"; 
  const projectId = "genbvbumxbmslhakulkz";
  
  return `postgresql://postgres.${projectId}:${password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&statement_cache_size=0`;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDbUrl()
    }
  }
});

module.exports = prisma;
