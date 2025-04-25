"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

export default function AuthDebugPage() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    userRole, 
    isSessionOnly,
    updateRole, 
    login, 
    logout 
  } = useAuth();
  
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Call the user API to test database access
  const testUserApi = async () => {
    try {
      setApiResponse(null);
      setApiError(null);
      
      const res = await fetch('/api/auth/user');
      const data = await res.json();
      
      setApiResponse(data);
    } catch (error: any) {
      setApiError(error.message || 'Failed to fetch user data');
    }
  };
  
  // Set role for testing
  const setRole = async (role: string) => {
    try {
      const success = await updateRole(role as any);
      if (success) {
        alert(`Role updated to ${role}`);
      } else {
        alert('Failed to update role');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            
            {isLoading ? (
              <p>Loading authentication state...</p>
            ) : (
              <div className="space-y-2">
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes ✅' : 'No ❌'}</p>
                <p><strong>User Role:</strong> {userRole || 'None'}</p>
                <p><strong>Session-Only Mode:</strong> {isSessionOnly ? 'Yes ⚠️' : 'No'}</p>
                
                {user && (
                  <div className="mt-4">
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Name:</strong> {user.name}</p>
                    {user.image && (
                      <div className="mt-2">
                        <p><strong>Profile Image:</strong></p>
                        <img 
                          src={user.image} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4 space-x-2">
                  {!isAuthenticated ? (
                    <button 
                      onClick={() => login('google')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Sign In with Google
                    </button>
                  ) : (
                    <button 
                      onClick={() => logout()}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            
            <button 
              onClick={testUserApi}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mb-4"
            >
              Test User API
            </button>
            
            {apiError && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
                <strong>Error:</strong> {apiError}
              </div>
            )}
            
            {apiResponse && (
              <div className="mt-4">
                <h3 className="font-semibold">API Response:</h3>
                <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded-md overflow-auto text-sm h-40">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        {isAuthenticated && (
          <div className="mt-6 bg-gray-100 p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Role Management</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setRole('student')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Set as Student
              </button>
              <button
                onClick={() => setRole('teacher')}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Set as Teacher
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
              Home
            </Link>
            <Link href="/auth" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
              Auth Page
            </Link>
            <Link href="/dashboard-redirect" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
              Dashboard Redirect
            </Link>
            {userRole && (
              <Link 
                href={`/${userRole}/dashboard`} 
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 border-t pt-4">
          <p>
            <strong>Note:</strong> This page is designed for debugging authentication issues.
            If Session-Only Mode is active, it means the app is functioning with limited database access.
            Users can still authenticate and use the application, but their data is only stored in their session.
          </p>
        </div>
      </div>
    </div>
  );
} 