"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

// This page is a fallback for redirecting to the correct dashboard
export default function DashboardRedirectPage() {
  const { isAuthenticated, userRole, isLoading, updateRole } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Redirecting to your dashboard...');
  const [showDebug, setShowDebug] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    // Wait longer to allow session to fully load
    const timer = setTimeout(() => {
      console.log("Initial redirection attempt...");
      setAttemptCount(prev => prev + 1);
      handleRedirection();
    }, 1000); // Increased delay to ensure session is loaded
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Watch for authentication state changes to handle redirection
  useEffect(() => {
    if (!isLoading && !isRedirecting) {
      console.log("Auth state changed, attempting redirection...", { isAuthenticated, userRole });
      handleRedirection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole, isLoading]);

  // Add a safety mechanism to prevent getting stuck in redirect loops
  useEffect(() => {
    if (attemptCount > 3) {
      console.warn("Too many redirect attempts, displaying debug info");
      setShowDebug(true);
      if (!error) {
        setError("Redirect process didn't complete. Please check debug info below.");
      }
    }
  }, [attemptCount, error]);

  async function handleRedirection() {
    // If still loading, don't redirect yet
    if (isLoading) {
      setMessage('Loading your profile...');
      return;
    }

    setIsRedirecting(true);
    console.log("Starting redirection process...", { isAuthenticated, userRole });
    
    try {
      // Get role from URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role');
    
      console.log(`Role from URL: ${roleParam}, Current role: ${userRole}`);
      
      // If user is authenticated but has no role, try to update from URL or redirect to auth page
      if (isAuthenticated && !userRole) {
        if (roleParam && (roleParam === 'student' || roleParam === 'teacher')) {
          console.log(`Setting role to ${roleParam} from URL parameter`);
          try {
            // Add a longer delay before trying to update role to ensure the session is fully loaded
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("Attempting role update now...");
            const success = await updateRole(roleParam);
            
            // Regardless of success, continue to the dashboard with the selected role
            // The updateRole function handles all the possible failure cases and
            // will at least attempt to set the role in the session
            console.log(`Proceeding with role: ${roleParam}, redirect success: ${success}`);
            setMessage(`Taking you to your ${roleParam} dashboard...`);
            
            setTimeout(() => {
              router.push(`/${roleParam}/dashboard`);
            }, 800);
            return;
          } catch (error) {
            console.error("Error during role update:", error);
            // Even if there's an error, let the user continue with the selected role
            setMessage(`Continuing as ${roleParam} despite role update error...`);
            setTimeout(() => {
              router.push(`/${roleParam}/dashboard`);
            }, 1000);
            return;
          }
        } else {
          // No role in URL, redirect to role selection
          console.log("No role found, redirecting to auth page for role selection");
          setMessage('Please select your role to continue...');
          setTimeout(() => {
            setIsRedirecting(false);
            router.push('/auth');
          }, 800);
          return;
        }
      }
      
      // If user is authenticated and has a role, redirect to their dashboard
      if (isAuthenticated && userRole) {
        console.log(`Using existing role: ${userRole}`);
        setMessage(`Taking you to your ${userRole} dashboard...`);
        setTimeout(() => {
          router.push(`/${userRole}/dashboard`);
        }, 300);
        return;
      }
    
      // If not authenticated, redirect to auth page
      if (!isAuthenticated) {
        console.log("Not authenticated, redirecting to auth");
        setError('Please sign in to continue');
        setTimeout(() => {
          setIsRedirecting(false);
          router.push('/auth');
        }, 1500);
        return;
      }

      // Fallback - should not reach here
      console.error("Fallback case reached - no conditions matched");
      setError('Could not determine where to redirect you. Going to debug page.');
      setTimeout(() => {
        setIsRedirecting(false);
        router.push('/auth-debug');
      }, 1500);
      
    } catch (err) {
      console.error("Error in redirection:", err);
      setError('An error occurred during redirection');
      // Show role selection buttons
      setShowDebug(true);
      setTimeout(() => {
        setIsRedirecting(false);
      }, 300);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Smart Note Companion</h1>
        
        {error ? (
          <div className="mt-4">
            <div className="text-red-500 mb-4">{error}</div>
            
            {/* Role selection buttons for the error case */}
            <div className="flex flex-col gap-3 mt-4 mb-6">
              <p className="text-sm text-gray-600">You can continue as:</p>
              <div className="flex justify-center gap-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => router.push('/student/dashboard')}
                >
                  Student
                </button>
                <button 
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  onClick={() => router.push('/teacher/dashboard')}
                >
                  Teacher
                </button>
              </div>
            </div>
            
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mt-4"
              onClick={() => router.push('/auth-debug')}
            >
              Go to Debug Page
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p>{message}</p>
          </div>
        )}
        
        {/* Debug button */}
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
              <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Is redirecting: {isRedirecting ? 'Yes' : 'No'}</p>
              <p>Attempt count: {attemptCount}</p>
              <div className="mt-3 flex gap-2">
                <button 
                  className="px-2 py-1 text-xs bg-blue-100 rounded hover:bg-blue-200" 
                  onClick={() => {
                    setIsRedirecting(false);
                    setAttemptCount(0);
                    handleRedirection();
                  }}
                >
                  Retry Redirection
                </button>
                <button 
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200" 
                  onClick={() => router.push('/auth-debug')}
                >
                  Go to Debug Page
                </button>
                <button 
                  className="px-2 py-1 text-xs bg-green-100 rounded hover:bg-green-200" 
                  onClick={() => router.push('/auth')}
                >
                  Go to Auth Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 