// lib/prisma.js - Fixed for Vercel deployment
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Global Prisma instance to prevent multiple connections
const globalForPrisma = globalThis;

// Create a single Prisma client instance
let prisma;
let isInitialized = false;

// Only initialize on the server side
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    // Check if we already have a prisma instance in global
    if (globalForPrisma.prisma) {
      prisma = globalForPrisma.prisma;
      isInitialized = true;
      console.log('[Prisma] Using existing client instance');
    } else {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const adapter = new PrismaPg(pool);
      
      prisma = new PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

      // Store in global for reuse
      globalForPrisma.prisma = prisma;
      isInitialized = true;
      console.log('[Prisma] Client initialized successfully');
    }
  } catch (error) {
    console.error('[Prisma] Failed to initialize:', error.message);
    // Create a fallback client without adapter (for build time)
    if (!prisma) {
      prisma = new PrismaClient();
      isInitialized = true;
    }
  }
}

// Export a function to get the prisma client
export function getPrisma() {
  if (!prisma) {
    // Fallback for build time
    prisma = new PrismaClient();
    isInitialized = true;
  }
  return prisma;
}

export { prisma, isInitialized };