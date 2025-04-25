"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export type UserRole = 'student' | 'teacher' | null;

/**
 * Custom hook for authentication using NextAuth
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSessionOnly, setIsSessionOnly] = useState(false);
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const userRole = session?.user?.role as UserRole;
  
  // Fetch latest user data from database including profile image
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      // Get user profile data
      fetch('/api/auth/user')
        .then(res => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (!data.error) {
            setUserData(data);
            
            // Check if we're in session-only mode
            if (data._sessionOnly) {
              console.log('Operating in session-only mode due to database issues');
              setIsSessionOnly(true);
            }
            
            // If the role is different from current session, update it
            if (data.role && data.role !== session.user.role) {
              console.log(`Updating session role from ${session.user.role} to ${data.role}`);
              update({
                ...session,
                user: {
                  ...session.user,
                  role: data.role
                }
              });
            }
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          // Continue with session data even if API fails
        });
    }
  }, [isAuthenticated, session, update]);
  
  // Login with a specific provider
  const login = (provider: 'google' | 'github' = 'google', callbackUrl = '/dashboard-redirect') => {
    signIn(provider, { callbackUrl });
  };
  
  // Update the user's role
  const updateRole = async (role: UserRole) => {
    if (!role) {
      console.error('No role provided');
      return false;
    }
    
    if (!isAuthenticated || !session?.user?.id) {
      console.error('Cannot update role: User not authenticated');
      return false;
    }
    
    console.log(`Attempting to update role to: ${role} for user: ${session.user.id}`);
    setIsUpdatingRole(true);
    
    // Validate the role
    const validRole = role === 'student' || role === 'teacher' ? role : null;
    if (!validRole) {
      console.error('Invalid role:', role);
      setIsUpdatingRole(false);
      return false;
    }
    
    let success = false;
    
    try {
      // If we know we're in session-only mode, skip the database update entirely
      if (isSessionOnly) {
        console.log("Operating in session-only mode, skipping database update");
        success = await trySessionOnlyUpdate(validRole);
      } else {
        // First try the full database update endpoint
        success = await tryDatabaseUpdate(validRole);
        
        // If that fails, try the session-only endpoint as a fallback
        if (!success) {
          console.log("Database update failed, trying session-only fallback...");
          success = await trySessionOnlyUpdate(validRole);
        }
      }
      
      if (success) {
        // Success - no automatic redirection
        return true;
      } else {
        // Both methods failed - try direct session update as a last resort
        console.log("All API methods failed, trying direct session update...");
        try {
          await update({
            ...session,
            user: {
              ...session?.user,
              role: validRole,
            },
          });
          console.log("Direct session update successful");
          return true;
        } catch (sessionError) {
          console.error("Direct session update failed:", sessionError);
          return false;
        }
      }
    } catch (error) {
      console.error('Unexpected error in updateRole:', error);
      return false;
    } finally {
      setIsUpdatingRole(false);
    }
  };
  
  // Try to update the role in the database
  const tryDatabaseUpdate = async (role: string) => {
    try {
      console.log("Attempting database role update...");
      
      // Call the API to update the role
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          // userId is optional, if not provided the API will update the current user's role
          role 
        }),
        // Ensure we're not using cached responses
        cache: 'no-store',
      });
      
      const contentType = response.headers.get('content-type');
      let responseData;
      
      // Safely parse the response
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        responseData = { error: 'Invalid response format', text };
      }
      
      // Log full response for debugging
      console.log('Role update API response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });
      
      // Check if we're in session-only mode
      if (responseData.sessionOnly) {
        setIsSessionOnly(true);
      }
      
      if (!response.ok && !responseData.success) {
        console.error('Database role update failed:', responseData);
        return false;
      }
      
      console.log('Role update successful:', responseData);
      
      // Update the session with the new role
      if (responseData.success) {
        console.log('Updating session with new role:', role);
        await update({
          ...session,
          user: {
            ...session?.user,
            role,
          },
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in database role update:', error);
      return false;
    }
  };
  
  // Try to update only the session role without database changes
  const trySessionOnlyUpdate = async (role: string) => {
    try {
      console.log("Attempting session-only role update...");
      
      // Call the session-only API
      const response = await fetch('/api/auth/session-only-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error('Session-only role update failed:', response.status);
        return false;
      }
      
      const responseData = await response.json();
      console.log('Session-only role update response:', responseData);
      
      // Update the session with the new role
      if (responseData.success) {
        console.log('Updating session with new role:', role);
        await update({
          ...session,
          user: {
            ...session?.user,
            role,
          },
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in session-only role update:', error);
      return false;
    }
  };
  
  // Logout the user
  const logout = () => {
    signOut({ callbackUrl: '/auth' });
  };
  
  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    isUpdatingRole,
    isSessionOnly,
    user: session?.user || userData,
    userRole,
    login,
    updateRole,
    logout,
  };
} 