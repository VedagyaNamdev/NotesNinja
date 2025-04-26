import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  console.log('Database debug route called');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL),
    nodeEnv: process.env.NODE_ENV || 'not set',
    prismaClientExists: !!db,
    prismaClientType: typeof db,
    isMockClient: !!(db as any)._isMock,
    connectionTest: null as any,
    error: null as any,
    mockClientInfo: (db as any)._isMock ? {
      isMockClient: true,
      reason: (db as any)._mockReason || 'unknown'
    } : null
  };
  
  // Try to execute a simple database query to test connection
  try {
    console.log('Testing database connection...');
    
    // Start timer
    const startTime = performance.now();
    
    // Try to get the number of users
    const userCount = await (db as PrismaClient).user.count();
    
    // End timer
    const endTime = performance.now();
    
    diagnostics.connectionTest = {
      success: true,
      userCount,
      queryTimeMs: Math.round(endTime - startTime)
    };
    
    console.log(`Database connection test successful. Query took ${diagnostics.connectionTest.queryTimeMs}ms`);
    console.log(`User count: ${userCount}`);
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    
    diagnostics.connectionTest = {
      success: false,
      errorType: error.name,
      errorCode: error.code || 'unknown'
    };
    
    diagnostics.error = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
  
  return NextResponse.json(diagnostics);
}

// Utility to mask sensitive parts of the database URL
function maskDatabaseUrl(url?: string): string {
  if (!url) return 'not set';
  
  try {
    // Replace password in the URL
    const maskedUrl = url.replace(/:([^@]+)@/, ':********@');
    
    // If we're in development, return a bit more info
    if (process.env.NODE_ENV === 'development') {
      return maskedUrl;
    }
    
    // In production, just return the hostname of the database
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}/[database-name]`;
  } catch (e) {
    return 'invalid url format';
  }
} 