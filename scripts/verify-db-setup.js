// Script to verify Prisma database setup
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Verifying Prisma database setup...');
  
  const prisma = new PrismaClient();
  
  try {
    // First verify database connection
    console.log('1. Testing database connection');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✓ Connection successful!');
    
    // Check database tables
    console.log('\n2. Checking database tables');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`   ✓ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`     - ${table.table_name}`);
    });
    
    // Try creating a test user
    console.log('\n3. Testing user creation');
    const testId = 'test-user-' + Math.random().toString(36).substring(2, 8);
    
    const newUser = await prisma.user.create({
      data: {
        id: testId,
        email: `test-${testId}@example.com`,
        name: 'Test User',
        role: 'student'
      }
    });
    
    console.log(`   ✓ Created test user: ${newUser.name} (${newUser.email})`);
    
    // Try creating a note
    console.log('\n4. Testing note creation');
    const newNote = await prisma.note.create({
      data: {
        title: 'Test Note',
        content: 'This is a test note created to verify database setup.',
        user: {
          connect: { id: newUser.id }
        }
      }
    });
    
    console.log(`   ✓ Created test note: ${newNote.title}`);
    
    // Try creating a flashcard deck
    console.log('\n5. Testing flashcard deck creation');
    const newDeck = await prisma.flashcardDeck.create({
      data: {
        name: 'Test Deck',
        user: {
          connect: { id: newUser.id }
        },
        flashcards: {
          create: [
            {
              question: 'What is Prisma?',
              answer: 'An ORM for Node.js and TypeScript'
            },
            {
              question: 'What database is this app using?',
              answer: 'PostgreSQL'
            }
          ]
        }
      },
      include: {
        flashcards: true
      }
    });
    
    console.log(`   ✓ Created test deck: ${newDeck.name} with ${newDeck.flashcards.length} flashcards`);
    
    // Try saving a quiz result
    console.log('\n6. Testing quiz result creation');
    const newQuizResult = await prisma.quizResult.create({
      data: {
        score: 85,
        questions: 10,
        correct: 8.5,
        user: {
          connect: { id: newUser.id }
        }
      }
    });
    
    console.log(`   ✓ Created test quiz result with score: ${newQuizResult.score}`);
    
    // Clean up test data
    console.log('\n7. Cleaning up test data');
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    console.log('   ✓ Deleted test user and all related data (cascade delete)');
    
    console.log('\n✅ All tests passed! Prisma database setup is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error verifying database setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 