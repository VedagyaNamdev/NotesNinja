"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

export default function ApplyRolePage() {
  const router = useRouter();
  const { isAuthenticated, updateRole, isUpdatingRole, user } = useAuth();
  const [message, setMessage] = useState('Preparing your account...');
  const [error, setError] = useState<string | null>(null);
  const [hasTriedApplying, setHasTriedApplying] = useState(false);
  const [selectedRoleForRedirect, setSelectedRoleForRedirect] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Force direct navigation to dashboard based on role
  const forceRedirectToDashboard = (role: string) => {
    if (isRedirecting) return; // Prevent multiple redirects
    
    setIsRedirecting(true);
    setMessage(`Redirecting to ${role} dashboard...`);
    
    // Store the role in multiple places for redundancy
    try {
      localStorage.setItem('selectedRole', role);
      localStorage.setItem('lastSelectedRole', role);
      sessionStorage.setItem('redirectRole', role);
    } catch (e) {
      console.error('Error storing role in storage:', e);
    }
    
    // Using plain URL navigation - bypass Next.js router completely
    const dashboardUrl = `${window.location.origin}/${role}/dashboard?force=true&ts=${Date.now()}`;
    console.log(`FORCE REDIRECTING TO: ${dashboardUrl}`);
    
    // Force a hard navigation
    window.location.href = dashboardUrl;
  };

  useEffect(() => {
    // Track when we've tried to apply the role to avoid infinite loops
    if (hasTriedApplying) return;
    
    async function applyRole() {
      if (!isAuthenticated || !user) {
        // Not authenticated yet, wait for auth state to update
        console.log('Not authenticated yet, waiting...');
        return;
      }

      try {
        setHasTriedApplying(true);
        // Get the selected role from localStorage, with fallbacks
        const selectedRole = 
          localStorage.getItem('selectedRole') || 
          localStorage.getItem('lastSelectedRole') || 
          sessionStorage.getItem('redirectRole') as 'student' | 'teacher' | null;
        
        if (!selectedRole) {
          console.error('No role found in storage');
          setError('No role was selected. Please go back and choose your role first.');
          return;
        }

        console.log(`Found role in storage: ${selectedRole}`);
        setMessage(`Setting up your ${selectedRole} account...`);
        // Save the role for redirection
        setSelectedRoleForRedirect(selectedRole);
        
        // Ensure role is stored in all locations
        localStorage.setItem('selectedRole', selectedRole);
        localStorage.setItem('lastSelectedRole', selectedRole);
        sessionStorage.setItem('redirectRole', selectedRole);
        
        // Apply the role
        const success = await updateRole(selectedRole);
        
        if (success) {
          console.log(`Successfully updated role to ${selectedRole}`);
          // The updateRole function now handles redirection itself
          // Just wait for it to complete
          setMessage(`Role set to ${selectedRole}. Redirecting to dashboard...`);
        } else {
          console.error('Failed to update role, trying forced redirect');
          // Force direct navigation as fallback
          forceRedirectToDashboard(selectedRole);
        }
      } catch (err) {
        console.error('Error applying role:', err);
        setError('An error occurred. Please try again.');
      }
    }

    const timer = setTimeout(() => {
      applyRole();
    }, 1000); // Small delay to ensure auth state is properly loaded

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router, updateRole, hasTriedApplying]);

  // If there's an error or we're still waiting, show loading UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Smart Note Companion</h1>
        
        {error ? (
          <div className="mt-4">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => router.push('/auth')}
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p>{message}</p>
            {isUpdatingRole && <p className="text-sm text-muted-foreground">This may take a few seconds...</p>}
          </div>
        )}
        
        {/* Optional debug info toggle at the bottom */}
        <div className="mt-6 text-xs text-center">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-gray-400 hover:text-gray-600"
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          {showDebug && (
            <div className="mt-2 text-left bg-gray-50 p-2 rounded">
              <p>Selected role: {selectedRoleForRedirect}</p>
              <p>Local storage role: {typeof window !== 'undefined' ? localStorage.getItem('lastSelectedRole') : 'N/A'}</p>
              <p>Session storage role: {typeof window !== 'undefined' ? sessionStorage.getItem('redirectRole') : 'N/A'}</p>
              <p>Current auth state: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 