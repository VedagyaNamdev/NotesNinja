const fs = require('fs');
const path = require('path');

// Common authentication code template for student pages
const studentAuthCode = `
// Authentication check
const { isAuthenticated, userRole } = useAuth();
const router = useRouter();

React.useEffect(() => {
  if (!isAuthenticated) {
    router.push('/auth');
  } else if (userRole !== 'student') {
    router.push(\`/\${userRole}/dashboard\`);
  }
}, [isAuthenticated, userRole, router]);

// Don't render until authenticated
if (!isAuthenticated || userRole !== 'student') {
  return null;
}
`;

// Common authentication code template for teacher pages
const teacherAuthCode = `
// Authentication check
const { isAuthenticated, userRole } = useAuth();
const router = useRouter();

React.useEffect(() => {
  if (!isAuthenticated) {
    router.push('/auth');
  } else if (userRole !== 'teacher') {
    router.push(\`/\${userRole}/dashboard\`);
  }
}, [isAuthenticated, userRole, router]);

// Don't render until authenticated
if (!isAuthenticated || userRole !== 'teacher') {
  return null;
}
`;

// Common import statements to add
const importsToAdd = `
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
`;

// Student pages that need to be updated
const studentPages = [
  'app/student/upload/page.tsx',
  'app/student/settings/page.tsx',
  'app/student/revision/page.tsx',
  'app/student/notes/page.tsx',
  'app/student/flashcards/page.tsx',
];

// Teacher pages that need to be updated
const teacherPages = [
  'app/teacher/upload/page.tsx',
  'app/teacher/tests/page.tsx',
  'app/teacher/test-generator/page.tsx',
  'app/teacher/settings/page.tsx',
];

// Function to update a page
function updatePage(filePath, authCode, isTeacher) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has duplicate auth blocks
    const role = isTeacher ? 'teacher' : 'student';
    const authPattern = new RegExp(`// Authentication check[\\s\\S]*?if \\(!isAuthenticated \\|\\| userRole !== '${role}'\\) \\{[\\s\\S]*?return null;[\\s\\S]*?\\}[\\s\\S]*?// Authentication check`, 'g');
    
    // Remove duplicated auth blocks if they exist
    if (authPattern.test(content)) {
      console.log(`Found duplicated auth blocks in ${filePath}, fixing...`);
      
      // Extract component definition pattern
      const componentRegex = /(?:export default function|const)\s+(\w+).*?(?:=>|\{)\s*{/s;
      const componentMatch = content.match(componentRegex);
      
      if (componentMatch) {
        // Find the position of the component definition
        const componentStart = componentMatch.index + componentMatch[0].length;
        
        // Extract the code after the component definition
        const afterComponentDef = content.substring(componentStart);
        
        // Replace duplicate auth blocks with a single auth block
        const cleanedCode = afterComponentDef.replace(authPattern, '// Authentication check');
        
        // Rebuild the content
        content = content.substring(0, componentStart) + authCode + cleanedCode.substring(cleanedCode.indexOf('return null;') + 'return null;'.length);
      }
    }
    // Ensure the file has 'use client' directive
    else if (!content.includes('"use client"')) {
      content = '"use client";\n\n' + content;
    }
    
    // Add import statements if they don't exist
    if (!content.includes("import { useAuth }")) {
      // Find the last import statement
      const importRegex = /^import.*?from.*?;$/gm;
      const imports = [...content.matchAll(importRegex)];
      
      if (imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const insertPosition = lastImport.index + lastImport[0].length;
        
        content = 
          content.slice(0, insertPosition) + 
          importsToAdd + 
          content.slice(insertPosition);
      }
    }
    
    // Remove AppLayout import if it exists
    content = content.replace(/import\s+AppLayout\s+from\s+['"]@\/components\/layout\/AppLayout['"];?\n?/g, '');
    
    // Check for component definition pattern
    const componentRegex = /(?:export default function|const)\s+(\w+).*?(?:=>|\{)\s*{/s;
    const componentMatch = content.match(componentRegex);
    
    if (componentMatch) {
      // Find where to insert the auth code (after the component definition)
      let insertPosition = componentMatch.index + componentMatch[0].length;
      
      // Check if auth code already exists
      const authCheckPattern = /\/\/ Authentication check[\s\S]*?if \(!isAuthenticated/;
      if (!authCheckPattern.test(content)) {
        // Add the auth code
        content = 
          content.slice(0, insertPosition) + 
          authCode + 
          content.slice(insertPosition);
      }
      
      // Replace AppLayout wrapper with fragment
      content = content.replace(/<AppLayout.*?userRole="(student|teacher)">\s*/g, '<>\n      ');
      content = content.replace(/\s*<\/AppLayout>/g, '\n    </>');
      
      // If it's a const component, ensure it's properly exported
      if (content.includes('const ') && !content.includes('export default')) {
        // Extract component name
        const componentName = componentMatch[1];
        
        // Add export at the end
        content = content.replace(
          /}\s*;?\s*$/,
          `};\n\nexport default ${componentName};\n`
        );
      }
      
      // Write the updated file
      fs.writeFileSync(filePath, content);
      console.log(`✅ Successfully updated ${filePath}`);
    } else {
      console.error(`❌ Could not find component definition in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process all pages
console.log('Updating student pages...');
studentPages.forEach(page => updatePage(page, studentAuthCode, false));

console.log('\nUpdating teacher pages...');
teacherPages.forEach(page => updatePage(page, teacherAuthCode, true));

console.log('\nAll pages updated!'); 