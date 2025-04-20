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
    try {
      console.log(`Updating role to: ${role}`);
      
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
      
      // Update the session with the new role
      await update({
        ...session,
        user: {
          ...session?.user,
          role,
        },
      });
      
      // Store the selected role temporarily to help with redirection
      sessionStorage.setItem('redirectRole', role);
      localStorage.setItem('lastSelectedRole', role);
      
      // Generate the dashboard URL based on the selected role (not the session role)
      const dashboardUrl = `/${role}/dashboard?newRole=true`;
      console.log(`Redirecting user to dashboard: ${dashboardUrl}`);
      
      // Use window.location.href for a full page navigation that bypasses Next.js router
      window.location.href = dashboardUrl;
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