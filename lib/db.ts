// This file will serve as the database client for Prisma
// It will be implemented once we set up Prisma ORM

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Function to create a new PrismaClient with error handling
function createPrismaClient() {
  try {
    console.log('Creating new PrismaClient instance...');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    const client = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
    
    // Add middleware for query logging in development
    if (process.env.NODE_ENV !== 'production') {
      client.$use(async (params, next) => {
        const before = Date.now();
        console.log(`Starting Prisma query: ${params.model}.${params.action}`);
        try {
          const result = await next(params);
          const after = Date.now();
          console.log(`Prisma Query ${params.model}.${params.action} took ${after - before}ms`);
          return result;
        } catch (error) {
          console.error(`Prisma Query ${params.model}.${params.action} failed:`, error);
          throw error;
        }
      });
    }
    
    console.log('PrismaClient instance created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create PrismaClient instance:', error);
    console.error('Error stack:', error.stack);
    // Return a mock client that logs operations but doesn't actually connect to the database
    return createFallbackClient();
  }
}

// Create a fallback client for when the database is unavailable
function createFallbackClient() {
  console.warn('Using fallback PrismaClient with no database connection');
  
  // This is a minimal mock that will just log operations and return empty results
  return {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    $use: () => {},
    $transaction: (fn: any) => Promise.resolve([]),
    
    // Add mock methods for all models
    // These will just log the operation and return empty results
    user: mockModel('user'),
    note: mockModel('note'),
    attachment: mockModel('attachment'),
    flashcardDeck: mockModel('flashcardDeck'),
    flashcard: mockModel('flashcard'),
    quizResult: mockModel('quizResult'),
  } as unknown as PrismaClient;
}

// Helper to create mock model methods
function mockModel(modelName: string) {
  return {
    findUnique: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.findUnique`, args);
      return Promise.resolve(null);
    },
    findFirst: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.findFirst`, args);
      return Promise.resolve(null);
    },
    findMany: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.findMany`, args);
      return Promise.resolve([]);
    },
    create: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.create`, args);
      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return Promise.resolve({ id: mockId, ...args.data, createdAt: new Date(), _isMock: true });
    },
    update: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.update`, args);
      return Promise.resolve({ id: args.where.id, ...args.data, _isMock: true });
    },
    updateMany: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.updateMany`, args);
      return Promise.resolve({ count: 0, _isMock: true });
    },
    delete: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.delete`, args);
      return Promise.resolve({ id: args.where.id, _isMock: true });
    },
    deleteMany: (args: any) => {
      console.log(`Mock Prisma: ${modelName}.deleteMany`, args);
      return Promise.resolve({ count: 0, _isMock: true });
    },
  };
}

// Use a singleton pattern to prevent multiple instances during hot reloading
let prismaClientPromise: PrismaClient | undefined;

try {
  if (!global.prisma) {
    console.log('Initializing new PrismaClient and connecting to database...');
    global.prisma = createPrismaClient();
    
    // Connect to database (async but don't await)
    global.prisma.$connect()
      .then(() => {
        console.log('Database connected successfully');
        // Test connection with a simple query
        return global.prisma.$queryRaw`SELECT 1 as test`;
      })
      .then((result) => {
        console.log('Database test query successful:', result);
      })
      .catch((e) => {
        console.error('Failed to connect to database:', e);
        console.error('Connection error details:', e.message);
        console.error('Error stack:', e.stack);
        
        // Additional diagnostics
        if (e.code === 'P1001') {
          console.error('Cannot reach database server. Check network connectivity and database server status.');
        } else if (e.code === 'P1003') {
          console.error('Database does not exist or is not accessible with the provided credentials.');
        } else if (e.code === 'P1017') {
          console.error('Server has closed the connection.');
        }
        
        console.log('Falling back to mock client');
        global.prisma = createFallbackClient();
      });
  } else {
    console.log('Using existing PrismaClient instance');
  }
  
  prismaClientPromise = global.prisma;
} catch (initError) {
  console.error('Error during PrismaClient initialization:', initError);
  console.error('Initialization error stack:', initError.stack);
  console.log('Creating fallback client');
  prismaClientPromise = createFallbackClient();
}

// Export the Prisma client
export const db = prismaClientPromise;

// Export database functions
export * from './prisma-db'; 