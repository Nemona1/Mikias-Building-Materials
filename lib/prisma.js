// lib/prisma.js - Fixed for Vercel deployment with proper client generation
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Global Prisma instance to prevent multiple connections
const globalForPrisma = globalThis;

// Create a single Prisma client instance
let prismaInstance = null;
let isInitialized = false;

// Helper function to get Prisma client
export function getPrisma() {
  // If we already have a client, return it
  if (prismaInstance) {
    return prismaInstance;
  }

  // Check if global has a client
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    isInitialized = true;
    return prismaInstance;
  }

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
      
      prismaInstance = new PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

      // Store in global for reuse
      globalForPrisma.prisma = prismaInstance;
      isInitialized = true;
      console.log('[Prisma] Client initialized successfully');
      return prismaInstance;
    } catch (error) {
      console.error('[Prisma] Failed to initialize with adapter:', error.message);
      
      // Fallback: Try without adapter (for build time)
      try {
        prismaInstance = new PrismaClient({
          log: ['error'],
        });
        globalForPrisma.prisma = prismaInstance;
        isInitialized = true;
        console.log('[Prisma] Client initialized without adapter (fallback)');
        return prismaInstance;
      } catch (fallbackError) {
        console.error('[Prisma] Fallback initialization failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  // Return a dummy client if nothing else works (for build time)
  console.warn('[Prisma] Returning dummy client (build time)');
  return new PrismaClient();
}

// Export prisma for backward compatibility
export const prisma = getPrisma();
export { isInitialized };

// Make sure Prisma client is generated
export async function ensurePrismaClient() {
  try {
    const prisma = getPrisma();
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('[Prisma] Connection failed:', error.message);
    return null;
  }
}