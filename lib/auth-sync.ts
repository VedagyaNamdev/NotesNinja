import { db } from './db';

/**
 * Syncs a user from the authentication system to the database
 * Creates a new user if they don't exist, or updates their information if they do
 * 
 * This is a placeholder implementation until Prisma is set up
 */
export async function syncUserWithDatabase(userData: {
  id: string;
  email: string | null;
  name: string | null;
  image?: string | null;
  role?: string;
}) {
  if (!userData.id) {
    throw new Error('User ID is required');
  }

  // Create a mock user object in case of errors
  const sessionOnlyUser = {
    id: userData.id,
    email: userData.email || 'unknown@example.com',
    name: userData.name || 'Unknown User',
    image: userData.image || null,
    role: userData.role || 'student',
    created_at: new Date().toISOString(),
    last_sign_in: new Date().toISOString(),
    _sessionOnly: true // Flag to indicate this user exists only in the session
  };

  try {
    const { id, email, name, image, role = 'student' } = userData;
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    });
    
    if (existingUser) {
      // Update user information if it has changed
      const updates: Record<string, any> = {
        // Always update the lastSignIn field
        lastSignIn: new Date()
      };
      
      if (email && email !== existingUser.email) updates.email = email;
      if (name && name !== existingUser.name) updates.name = name;
      if (image && image !== existingUser.image) updates.image = image;
      
      // Only update the role if it's explicitly provided and different
      if (userData.role && userData.role !== existingUser.role) {
        updates.role = userData.role;
      }
      
      // Skip update if only the lastSignIn field is being updated
      if (Object.keys(updates).length <= 1) {
        console.log(`No significant changes for user ${id}, skipping update`);
        return existingUser;
      }
      
      // Update the user with the latest information
      console.log(`Updating user information for ${id}`);
      
      try {
        const updatedUser = await db.user.update({
          where: { id },
          data: updates
        });
        
        return updatedUser;
      } catch (updateError) {
        console.error('Error updating user in database:', updateError);
        return {
          ...existingUser,
          ...updates,
          _sessionOnly: true
        };
      }
    } else {
      // Create new user in database
      console.log(`Creating new user in database: ${id} (${email})`);
      
      try {
        const newUser = await db.user.create({
          data: {
            id,
            email: email || 'unknown@example.com',
            name: name || 'Unknown User',
            image,
            role,
            createdAt: new Date(),
            lastSignIn: new Date()
          }
        });
        
        return newUser;
      } catch (insertError) {
        console.error('Error creating user in database:', insertError);
        return sessionOnlyUser;
      }
    }
  } catch (error) {
    console.error('Error syncing user with database:', error);
    // Return a session-only user instead of throwing
    return sessionOnlyUser;
  }
} 