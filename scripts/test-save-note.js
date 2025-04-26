// Test script for saving a note
const { PrismaClient } = require('@prisma/client');

async function testSaveNote() {
  console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
  
  // Create a new client
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully!');
    
    // First, we need a user - let's check if the test user exists or create one
    console.log('Checking for test user...');
    let user = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    });
    
    if (!user) {
      console.log('Creating test user...');
      user = await prisma.user.create({
        data: {
          id: 'test-user-id-' + Date.now(),
          email: 'test@example.com',
          name: 'Test User',
          role: 'student',
          createdAt: new Date(),
          lastSignIn: new Date()
        }
      });
      console.log('Test user created:', user);
    } else {
      console.log('Found existing test user:', user);
    }
    
    // Try a different approach - manually constructing a query that avoids the attachment_id
    console.log('Trying direct SQL approach for creating a note...');
    
    try {
      // First check the notes table structure
      console.log('Checking notes table structure...');
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notes'
      `;
      console.log('Notes table columns:', tableInfo);
      
      // Try a simpler approach with prisma.note.create but selecting the fields explicitly
      console.log('Creating test note using Prisma ORM with explicit fields...');
      const note = await prisma.$queryRaw`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (
          $1, 
          $2, 
          $3, 
          NOW(), 
          NOW(), 
          $4
        )
        RETURNING id, title, content, created_at, updated_at, user_id
      `;
      
      console.log('Test note created successfully with raw SQL:', note);
      return true;
    } catch (sqlError) {
      console.error('SQL approach failed:', sqlError);
      
      // Last resort - try using the most basic Prisma method
      console.log('Trying one last approach with executeRaw...');
      const noteId = 'test-note-' + Date.now();
      
      try {
        const result = await prisma.$executeRaw`
          INSERT INTO "public"."notes" ("id", "title", "content", "created_at", "updated_at", "user_id")
          VALUES (${noteId}, 'Test Note', 'Test Content', NOW(), NOW(), ${user.id})
        `;
        
        console.log('Final approach succeeded! Rows affected:', result);
        return true;
      } catch (finalError) {
        console.error('Final approach also failed:', finalError);
        throw finalError;
      }
    }
  } catch (error) {
    console.error('Note creation test failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    return false;
  } finally {
    // Disconnect
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testSaveNote()
  .then(success => {
    if (success) {
      console.log('Note creation test passed!');
      process.exit(0);
    } else {
      console.log('Note creation test failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 