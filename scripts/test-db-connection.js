// Test script for Prisma database connection
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing Prisma database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection by running a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful!', result);
    
    // Get database information
    const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database info:', dbInfo);
    
    // List tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Create a test user (will be skipped if error)
    try {
      const testUser = await prisma.user.upsert({
        where: { id: 'test-user-id' },
        update: { 
          email: 'test@example.com',
          name: 'Test User',
          lastSignIn: new Date()
        },
        create: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'student'
        }
      });
      
      console.log('Test user created/updated:', testUser);
    } catch (userError) {
      console.error('Error creating test user:', userError);
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 