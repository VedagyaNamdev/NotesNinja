"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

// This page is a fallback for redirecting to the correct dashboard
export default function DashboardRedirectPage() {
  const { isAuthenticated, userRole, user, isLoading, updateRole } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Redirecting to your dashboard...');
  const [showDebug, setShowDebug] = useState(false);

  // Utility function to get the stored role
  const getStoredRole = () => {
    if (typeof window === 'undefined') return null;
    // Try session storage first as it's more likely to have the freshly selected role
    const sessionRole = sessionStorage.getItem('redirectRole');
    if (sessionRole) {
      console.log("Found role in sessionStorage:", sessionRole);
      return sessionRole;
    }
    
    // Then try localStorage
    const localRole = localStorage.getItem('selectedRole') || localStorage.getItem('lastSelectedRole');
    if (localRole) {
      console.log("Found role in localStorage:", localRole);
      return localRole;
    }
    
    return null;
  };

  // Direct navigation function
  const directNavigate = (role: string) => {
    if (!role) {
      console.error("Cannot navigate to dashboard - no role provided");
      setError("Role is missing. Please go back and select a role.");
      return;
    }
    
    // Clean and validate the role
    const validRole = role.trim().toLowerCase();
    if (validRole !== 'student' && validRole !== 'teacher') {
      console.error(`Invalid role detected: ${validRole}`);
      setError(`Invalid role: ${validRole}. Please go back and select a valid role.`);
      return;
    }
    
    // Store the role everywhere to ensure it's properly saved
    localStorage.setItem('selectedRole', validRole);
    localStorage.setItem('lastSelectedRole', validRole);
    sessionStorage.setItem('redirectRole', validRole);
    
    // Force the role update in database
    if (isAuthenticated) {
      console.log(`Updating role in database to: ${validRole}`);
      updateRole(validRole);
    }
    
    // Redirect with a timestamp to avoid caching
    const dashboardUrl = `/${validRole}/dashboard?fromRedirect=true&ts=${Date.now()}`;
    console.log(`Redirecting to ${dashboardUrl}`);
    
    // Use direct navigation to bypass Next.js router
    window.location.href = dashboardUrl;
  };

  useEffect(() => {
    if (isLoading) {
      setMessage('Loading your profile...');
      return;
    }

    if (!isAuthenticated) {
      setMessage('You need to login first');
      
      // Redirect to auth page after a short delay
      const timer = setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // First try to get role from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam && (roleParam === 'student' || roleParam === 'teacher')) {
      console.log(`Using role from URL parameter: ${roleParam}`);
      directNavigate(roleParam);
      return;
    }

    // Try to get stored role
    const storedRole = getStoredRole();
    
    // If we have a stored role, use it (this takes precedence over session)
    if (storedRole) {
      console.log(`Found stored role: ${storedRole}`);
      directNavigate(storedRole);
      return;
    }
    
    // If no stored role but user has a role from the session, use that
    if (userRole) {
      console.log(`Using role from session: ${userRole}`);
      directNavigate(userRole);
      return;
    }

    // If still no role, show error and redirect to auth
    setError('Could not determine your role. Please go back and select a role.');
    
    const timer = setTimeout(() => {
      window.location.href = '/auth';
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, userRole, user, updateRole]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Smart Note Companion</h1>
        
        {error ? (
          <div className="mt-4">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => window.location.href = '/auth'}
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p>{message}</p>
          </div>
        )}
        
        {/* Debug button at the bottom that only shows debug info when clicked */}
        <div className="mt-8 text-xs text-center">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-gray-400 hover:text-gray-600"
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          {showDebug && (
            <div className="mt-2 text-left bg-gray-50 p-2 rounded">
              <p>User role from session: {userRole || 'None'}</p>
              <p>URL role param: {typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('role') : 'N/A'}</p>
              <p>Session storage role: {typeof window !== 'undefined' ? sessionStorage.getItem('redirectRole') : 'N/A'}</p>
              <p>Local storage role (selectedRole): {typeof window !== 'undefined' ? localStorage.getItem('selectedRole') : 'N/A'}</p>
              <p>Local storage role (lastSelectedRole): {typeof window !== 'undefined' ? localStorage.getItem('lastSelectedRole') : 'N/A'}</p>
              <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 