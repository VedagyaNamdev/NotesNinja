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
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [selectedRoleForRedirect, setSelectedRoleForRedirect] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Force direct navigation to dashboard based on role
  const forceRedirectToDashboard = (role: string) => {
    if (isRedirecting) return; // Prevent multiple redirects
    
    setIsRedirecting(true);
    setMessage(`Redirecting to ${role} dashboard...`);
    
    // Using plain URL navigation - bypass Next.js router completely
    const dashboardUrl = `${window.location.origin}/${role}/dashboard?newRole=true&ts=${Date.now()}`;
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
        // Get the selected role from localStorage
        const selectedRole = localStorage.getItem('selectedRole') as 'student' | 'teacher' | null;
        
        if (!selectedRole) {
          console.error('No role found in localStorage');
          setError('No role was selected. Please go back and choose your role first.');
          return;
        }

        console.log(`Found role in localStorage: ${selectedRole}`);
        setMessage(`Setting up your ${selectedRole} account...`);
        // Save the role for redirection
        setSelectedRoleForRedirect(selectedRole);
        
        // Apply the role
        const success = await updateRole(selectedRole);
        
        if (success) {
          // Clear the stored role selection from the auth flow
          localStorage.removeItem('selectedRole');
          console.log(`Successfully updated role to ${selectedRole}`);
          
          // Store the selected role to help with redirection
          sessionStorage.setItem('redirectRole', selectedRole);
          localStorage.setItem('lastSelectedRole', selectedRole);
          
          // Force direct navigation - no Next.js router
          forceRedirectToDashboard(selectedRole);
        } else {
          console.error('Failed to update role');
          setError('Failed to update your role. Please try again.');
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

  // Add an additional effect to handle redirection failures
  useEffect(() => {
    // Don't run this effect if we haven't tried applying the role yet
    if (!hasTriedApplying || isRedirecting) return;
    
    // Don't try more than 3 times to avoid redirect loops
    if (redirectAttempts >= 3) return;
    
    const redirectTimer = setTimeout(() => {
      const currentPath = window.location.pathname;
      // If we're still on the apply-role page after 5 seconds, try redirecting again
      if (currentPath === '/auth/apply-role') {
        setRedirectAttempts(prev => prev + 1);
        // Use the stored role from state first, then try localStorage backup
        const roleToUse = selectedRoleForRedirect || localStorage.getItem('lastSelectedRole') as 'student' | 'teacher';
        
        if (roleToUse) {
          console.log(`Still on apply-role page, attempting redirect again (attempt ${redirectAttempts + 1}) to role: ${roleToUse}`);
          // Force a direct navigation
          forceRedirectToDashboard(roleToUse);
        } else {
          console.error("No role found for redirection");
          setError("Could not determine your role. Please try again.");
        }
      }
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [hasTriedApplying, redirectAttempts, selectedRoleForRedirect, isRedirecting]);

  // Allow manual redirect
  const handleManualRedirect = () => {
    const role = selectedRoleForRedirect || localStorage.getItem('lastSelectedRole');
    if (role) {
      forceRedirectToDashboard(role);
    } else {
      setError("No role found. Please go back and select a role.");
    }
  };
 
  // Add debug component
  const DebugInfo = () => {
    const [localStorageRole, setLocalStorageRole] = useState<string | null>(null);
    const [sessionStorageRole, setSessionStorageRole] = useState<string | null>(null);
    
    useEffect(() => {
      setLocalStorageRole(localStorage.getItem('selectedRole') || localStorage.getItem('lastSelectedRole'));
      setSessionStorageRole(sessionStorage.getItem('redirectRole'));
    }, []);
    
    return (
      <div className="mt-4 text-xs text-gray-500 text-left">
        <details>
          <summary>Debug Info</summary>
          <div className="mt-2 space-y-1 pl-2">
            <p>Selected role state: {selectedRoleForRedirect}</p>
            <p>Local storage role: {localStorageRole}</p>
            <p>Session storage role: {sessionStorageRole}</p>
            <p>Current auth state: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
            <p>User role from session: {user?.role || 'None'}</p>
            <p>Redirect attempts: {redirectAttempts}</p>
          </div>
        </details>
      </div>
    );
  };

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
            {selectedRoleForRedirect && (
              <div className="text-sm text-blue-600">Selected role: {selectedRoleForRedirect}</div>
            )}
            {isUpdatingRole && <p className="text-sm text-muted-foreground">This may take a few seconds...</p>}
            {redirectAttempts > 0 && (
              <div className="mt-2 text-sm text-amber-600">
                Redirect attempt {redirectAttempts} of 3...
              </div>
            )}
            
            {hasTriedApplying && !isRedirecting && (
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleManualRedirect}
              >
                Click here to go to dashboard
              </button>
            )}
          </div>
        )}
        <DebugInfo />
      </div>
    </div>
  );
} 