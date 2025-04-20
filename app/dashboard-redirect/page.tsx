"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

// This page is a fallback for redirecting to the correct dashboard
export default function DashboardRedirectPage() {
  const { isAuthenticated, userRole, user, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Redirecting to your dashboard...');
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  // Direct navigation function
  const directNavigate = (role: string) => {
    const dashboardUrl = `/${role}/dashboard?fromRedirect=true`;
    console.log(`Redirecting to ${dashboardUrl}`);
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

    // First check if user has a role from the session
    if (userRole) {
      console.log(`User has role from session: ${userRole}`);
      directNavigate(userRole);
      return;
    }

    // If no role in session, check localStorage/sessionStorage
    const storedRole = localStorage.getItem('lastSelectedRole') || 
                      sessionStorage.getItem('redirectRole');
    
    if (storedRole) {
      console.log(`Found role in storage: ${storedRole}`);
      directNavigate(storedRole);
      return;
    }

    // If still no role, show error and redirect to auth
    setError('Could not determine your role. Please select a role.');
    
    const timer = setTimeout(() => {
      window.location.href = '/auth';
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, userRole, user]);

  // Additional fallback in case the redirect didn't happen
  useEffect(() => {
    if (error || !isAuthenticated) return;
    
    if (redirectAttempts >= 2) {
      setError('Redirection failed. Please try again.');
      return;
    }
    
    const timer = setTimeout(() => {
      const role = userRole || 
                  localStorage.getItem('lastSelectedRole') || 
                  sessionStorage.getItem('redirectRole');
      
      if (role && window.location.pathname === '/dashboard-redirect') {
        setRedirectAttempts(prev => prev + 1);
        setMessage(`Redirect attempt ${redirectAttempts + 1}...`);
        directNavigate(role);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [redirectAttempts, isAuthenticated, userRole, error]);

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
              Go to Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <p>{message}</p>
            {redirectAttempts > 0 && (
              <div className="mt-2 text-sm text-amber-600">
                Redirect attempt {redirectAttempts} of 2...
              </div>
            )}
            
            <div className="mt-4">
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => {
                  const role = userRole || 
                             localStorage.getItem('lastSelectedRole') || 
                             'student'; // Default fallback
                  directNavigate(role);
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        <div className="mt-4 text-xs text-gray-500 text-left">
          <details>
            <summary>Debug Info</summary>
            <div className="mt-2 space-y-1 pl-2">
              <p>User role from session: {userRole || 'None'}</p>
              <p>Is authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Local storage role: {typeof window !== 'undefined' ? localStorage.getItem('lastSelectedRole') : 'N/A'}</p>
              <p>Session storage role: {typeof window !== 'undefined' ? sessionStorage.getItem('redirectRole') : 'N/A'}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
} 