const { PrismaClient } = require('@prisma/client');

// Final Verified Golden String for Vercel Production
const getDbUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  
  // If user provided a pooler URL in Vercel, use it
  if (envUrl.includes('pooler')) return envUrl;

  // Otherwise, use our verified fallback with the password that PASSED local verification
  const password = "POSFreshnaad123"; 
  const projectId = "genbvbumxbmslhakulkz";
  
  return `postgresql://postgres.${projectId}:${password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&statement_cache_size=0`;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDbUrl()
    }
  }
});

module.exports = prisma;
