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
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const userRole = session?.user?.role as UserRole;
  
  // Fetch latest user data from database including profile image
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetch('/api/auth/user')
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUserData(data);
            
            // Update session if necessary
            if (data.image && data.image !== session.user.image) {
              update({
                ...session,
                user: {
                  ...session.user,
                  image: data.image
                }
              });
            }
          }
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [isAuthenticated, session, update]);
  
  // Login with a specific provider
  const login = (provider: 'google' | 'github' = 'google', callbackUrl = '/auth') => {
    signIn(provider, { callbackUrl });
  };
  
  // Update the user's role
  const updateRole = async (role: UserRole) => {
    if (!role) return false;
    
    setIsUpdatingRole(true);
    console.log(`Updating role to: ${role}`);
    
    try {
      // First, store the role securely to ensure redirects work even if API calls fail
      // This ensures our apply-role page can still redirect correctly
      localStorage.setItem('selectedRole', role);
      localStorage.setItem('lastSelectedRole', role);
      sessionStorage.setItem('redirectRole', role);
      
      // Call the API to update the role in the database
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error updating role:', data);
        throw new Error(data.error || 'Failed to update role');
      }
      
      console.log('API role update successful:', data);
      
      // Update the session with the new role
      try {
        console.log('Updating session with new role:', role);
        await update({
          ...session,
          user: {
            ...session?.user,
            role,
          },
        });
        console.log('Session updated successfully with role:', role);
      } catch (sessionError) {
        console.error('Error updating session:', sessionError);
        // Continue even if session update failed, the middleware will handle this
      }
      
      // The redirection will be handled in the apply-role page
      return true;
    } catch (error) {
      console.error('Failed to update role:', error);
      return false;
    } finally {
      setIsUpdatingRole(false);
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
    user: userData || session?.user,
    userRole,
    login,
    updateRole,
    logout,
  };
} 