// This file will serve as the database client for Prisma
// It will be implemented once we set up Prisma ORM

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Use a singleton pattern to prevent multiple instances during hot reloading
export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

// Export database functions
export * from './prisma-db'; 