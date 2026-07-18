// Prisma client - server-side only
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma = null;
let isInitialized = false;

// Only initialize on the server side
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    const globalForPrisma = globalThis;

    prisma = globalForPrisma.prisma || new PrismaClient({
      adapter: adapter,
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }
    
    isInitialized = true;
    console.log('[Prisma] Client initialized successfully');
  } catch (error) {
    console.error('[Prisma] Failed to initialize:', error.message);
  }
}

export { prisma, isInitialized };
