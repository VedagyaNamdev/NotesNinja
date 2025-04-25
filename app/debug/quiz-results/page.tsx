"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { saveQuizResult } from '@/lib/data-service';
import { randomUUID } from 'crypto';

export default function DebugQuizResultsPage() {
  const { isAuthenticated, userRole, user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [directApiResults, setDirectApiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Load existing quiz results
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchQuizResults();
    }
  }, [isAuthenticated, user?.id]);
  
  const fetchQuizResults = async () => {
    try {
      const response = await fetch('/api/quiz-results');
      if (!response.ok) throw new Error('Failed to fetch quiz results');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      toast.error('Failed to fetch quiz results');
    }
  };
  
  // Test data service function
  const testDataServiceSave = async () => {
    try {
      setLoading(true);
      
      const mockQuizResult = {
        score: 85,
        questions: 10,
        correct: 8.5
      };
      
      console.log('Testing quiz result save via data service:', mockQuizResult);
      
      const result = await saveQuizResult(mockQuizResult);
      console.log('Save result:', result);
      
      toast.success('Quiz result saved via data service');
      fetchQuizResults(); // Refresh list
    } catch (error) {
      console.error('Error saving quiz result via data service:', error);
      toast.error('Failed to save quiz result via data service', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Test direct API call
  const testDirectApiCall = async () => {
    try {
      setApiLoading(true);
      
      const mockQuizResult = {
        score: 70,
        questions: 5,
        correct: 3.5
      };
      
      console.log('Testing quiz result save via direct API call:', mockQuizResult);
      
      const response = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockQuizResult),
      });
      
      const responseText = await response.text();
      console.log('API Response status:', response.status);
      console.log('API Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response as JSON:', e);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText} - ${responseText}`);
      }
      
      toast.success('Quiz result saved via direct API call');
      fetchQuizResults(); // Refresh list
      
      // Add to the direct API results list
      setDirectApiResults(prev => [...prev, {
        ...mockQuizResult,
        savedAt: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error saving quiz result via direct API call:', error);
      toast.error('Failed to save quiz result via direct API call', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setApiLoading(false);
    }
  };
  
  // Test DB util directly (requires additional debug endpoint)
  const testDbUtilDirectly = async () => {
    try {
      setApiLoading(true);
      
      const mockQuizResult = {
        score: 90,
        questions: 10,
        correct: 9
      };
      
      console.log('Testing quiz result save via debug endpoint:', mockQuizResult);
      
      const response = await fetch('/api/debug/save-quiz-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockQuizResult),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Debug API response:', result);
      
      toast.success('Quiz result saved via debug endpoint');
      fetchQuizResults(); // Refresh list
    } catch (error) {
      console.error('Error saving quiz result via debug endpoint:', error);
      toast.error('Failed to save quiz result via debug endpoint', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setApiLoading(false);
    }
  };
  
  // View database connection status
  const checkDbConnection = async () => {
    try {
      setApiLoading(true);
      
      const response = await fetch('/api/debug/db-connection');
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Database connection successful', {
          description: `Connected to ${data.database || 'PostgreSQL'}`
        });
      } else {
        toast.error('Database connection failed', {
          description: data.error || 'Unknown error'
        });
      }
      
      console.log('Database connection check:', data);
    } catch (error) {
      console.error('Error checking database connection:', error);
      toast.error('Failed to check database connection');
    } finally {
      setApiLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <p>Please log in to access this debug page.</p>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Quiz Results Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify({
                id: user?.id,
                email: user?.email,
                name: user?.name,
                role: userRole,
                isAuthenticated
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Test saving quiz result through the data service</p>
              <Button 
                onClick={testDataServiceSave} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Data Service'} 
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Test saving quiz result directly through the API</p>
              <Button 
                onClick={testDirectApiCall} 
                disabled={apiLoading}
                className="w-full"
              >
                {apiLoading ? 'Testing...' : 'Test Direct API Call'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Test saving quiz result with direct DB util function</p>
              <Button 
                onClick={testDbUtilDirectly} 
                disabled={apiLoading}
                className="w-full"
              >
                {apiLoading ? 'Testing...' : 'Test DB Util Directly'}
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Check database connection</p>
              <Button 
                onClick={checkDbConnection} 
                disabled={apiLoading}
                className="w-full"
                variant="outline"
              >
                {apiLoading ? 'Checking...' : 'Check DB Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No quiz results found in the database.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">ID</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Score</th>
                        <th className="py-2 px-4 text-left">Questions</th>
                        <th className="py-2 px-4 text-left">Correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.map((result) => (
                        <tr key={result.id} className="border-b">
                          <td className="py-2 px-4">{result.id.substring(0, 8)}...</td>
                          <td className="py-2 px-4">{new Date(result.date).toLocaleString()}</td>
                          <td className="py-2 px-4">{result.score}%</td>
                          <td className="py-2 px-4">{result.questions}</td>
                          <td className="py-2 px-4">{result.correct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={fetchQuizResults} variant="outline" size="sm">
                  Refresh Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 