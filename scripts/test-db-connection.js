// Test script for database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
  
  // Create a new client
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully!');
    
    // Test a simple query
    console.log('Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);
    
    // Test user table
    console.log('Testing user table query...');
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database`);
    
    return true;
  } catch (error) {
    console.error('Database connection test failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide more specific diagnostics
    if (error.code === 'P1001') {
      console.error('Cannot reach database server. Check network connectivity and database server status.');
    } else if (error.code === 'P1003') {
      console.error('Database does not exist or is not accessible with the provided credentials.');
    } else if (error.code === 'P1017') {
      console.error('Server has closed the connection.');
    }
    
    return false;
  } finally {
    // Disconnect
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('All database tests passed!');
      process.exit(0);
    } else {
      console.log('Database tests failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 