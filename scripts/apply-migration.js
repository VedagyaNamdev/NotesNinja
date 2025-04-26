const { execSync } = require('child_process');

console.log('Applying Prisma migration...');

try {
  // This runs the migration command and automatically answers 'y' to the prompt
  execSync('echo y | npx prisma migrate dev --name add_attachment_id_to_notes', { 
    stdio: 'inherit',
    shell: true
  });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Error applying migration:', error);
  process.exit(1);
} 