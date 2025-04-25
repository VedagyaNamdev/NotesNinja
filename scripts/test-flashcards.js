// Script to test flashcard functionality
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing flashcard functionality...');
  
  const prisma = new PrismaClient();
  
  try {
    // First create a test user
    console.log('1. Creating test user');
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
    
    // Create a flashcard deck
    console.log('\n2. Creating flashcard deck');
    const newDeck = await prisma.flashcardDeck.create({
      data: {
        name: 'Test Flashcard Deck',
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
    
    console.log(`   ✓ Created deck: ${newDeck.name} with ${newDeck.flashcards.length} flashcards`);
    
    // Get all flashcard decks for user
    console.log('\n3. Fetching user\'s flashcard decks');
    const decks = await prisma.flashcardDeck.findMany({
      where: {
        userId: newUser.id
      },
      include: {
        flashcards: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`   ✓ Found ${decks.length} decks for user`);
    
    // Update deck progress
    console.log('\n4. Updating deck progress');
    const updatedDeck = await prisma.flashcardDeck.update({
      where: {
        id: newDeck.id
      },
      data: {
        progress: 0.5,
        lastStudied: new Date()
      }
    });
    
    console.log(`   ✓ Updated deck progress to ${updatedDeck.progress}`);
    
    // Update card mastery
    console.log('\n5. Updating card mastery');
    const firstCard = newDeck.flashcards[0];
    const updatedCard = await prisma.flashcard.update({
      where: {
        id: firstCard.id
      },
      data: {
        mastered: true
      }
    });
    
    console.log(`   ✓ Updated card mastery to ${updatedCard.mastered}`);
    
    // Delete the deck and all associated cards
    console.log('\n6. Deleting flashcard deck');
    await prisma.flashcardDeck.delete({
      where: {
        id: newDeck.id
      }
    });
    
    console.log('   ✓ Deleted flashcard deck and all cards');
    
    // Clean up test data
    console.log('\n7. Cleaning up test data');
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    console.log('   ✓ Deleted test user');
    
    console.log('\n✅ All flashcard tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error testing flashcard functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 