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
        
        // Apply the role
        const success = await updateRole(selectedRole);
        
        if (success) {
          // Clear the stored role selection from the auth flow
          localStorage.removeItem('selectedRole');
          console.log(`Successfully updated role to ${selectedRole}`);
          
          // Store the selected role to help with redirection
          sessionStorage.setItem('redirectRole', selectedRole);
          localStorage.setItem('lastSelectedRole', selectedRole);
          
          // Navigate to the appropriate dashboard with a small delay
          // to ensure the session is updated
          setTimeout(() => {
            // Generate the dashboard URL based on the selected role
            const dashboardPath = `/${selectedRole}/dashboard?newRole=true`;
            console.log(`Redirecting to dashboard: ${dashboardPath}`);
            
            // Use direct window.location.href for a clean navigation
            window.location.href = dashboardPath;
          }, 1000);
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
      </div>
    </div>
  );
} 