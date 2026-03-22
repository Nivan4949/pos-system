const { PrismaClient } = require('@prisma/client');

const getDbUrl = () => {
  const envUrl = process.env.DATABASE_URL || '';
  if (envUrl.includes('pooler')) return envUrl;

  const projectId = "genbvbumxbmslhakulkz";
  
  // Try POSFreshnaad123 first (Verified locally)
  // If we had a way to catch errors here, we would. 
  // Since we don't, we'll use a single robust one or a combination.
  const password = "POSFreshnaad123"; 
  
  const url = `postgresql://postgres.${projectId}:${password}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&statement_cache_size=0`;
  
  console.log(`[Database] Connecting to Pooler at ${projectId}... (using verified fallback)`);
  return url;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDbUrl()
    }
  }
});

// Diagnostic to confirm we can reach out
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failure:', err.message));

module.exports = prisma;
