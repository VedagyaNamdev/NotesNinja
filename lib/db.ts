// This file will serve as the database client for Prisma
// It will be implemented once we set up Prisma ORM

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create a new PrismaClient instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

// Ensure we only create one instance of PrismaClient
const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, store the PrismaClient instance in the global object
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Export the Prisma client
export const db = prisma;

// Export database functions
export * from './prisma-db'; 