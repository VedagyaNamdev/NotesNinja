import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Bug, RefreshCw, User, UserCheck, UserPlus } from 'lucide-react';

interface QuizDebugPanelProps {
  onSubmitResult?: (score: number, total: number) => Promise<any>;
  showPanel?: boolean; // This can be controlled by environment variables or query params
}

export default function QuizDebugPanel({ onSubmitResult, showPanel = true }: QuizDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);
  
  // Don't show in production
  if (process.env.NODE_ENV === 'production' && !showPanel) {
    return null;
  }
  
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };
  
  const testSubmitResult = async () => {
    if (!onSubmitResult) {
      addLog('No submit function provided');
      return;
    }
    
    setIsLoading(true);
    addLog('Testing quiz result submission with sample data...');
    
    try {
      const score = 7;
      const total = 10;
      
      addLog(`Submitting score: ${score}/${total}`);
      const result = await onSubmitResult(score, total);
      
      addLog('Submission completed');
      setResults(prev => [{ 
        timestamp: new Date().toISOString(),
        score,
        total,
        result 
      }, ...prev]);
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Quiz debug test error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkQuizResults = async () => {
    setIsLoading(true);
    addLog('Fetching quiz results from API...');
    
    try {
      const response = await fetch('/api/quiz-results');
      
      if (!response.ok) {
        addLog(`API error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      addLog(`Fetched ${data.length} quiz results`);
      
      // Show in logs
      if (data.length > 0) {
        addLog(`Latest result: ${new Date(data[0].date).toLocaleString()} - ${data[0].score}%`);
      } else {
        addLog('No quiz results found');
      }
    } catch (error) {
      addLog(`Error fetching results: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Error fetching quiz results:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUserStatus = async () => {
    setIsLoading(true);
    addLog('Checking user status...');
    
    try {
      const response = await fetch('/api/debug/check-user');
      
      if (!response.ok) {
        addLog(`API error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      setUserStatus(data);
      
      if (data.userInDatabase) {
        addLog(`User exists in database: ${data.userDetails.name} (${data.userDetails.email})`);
      } else {
        addLog(`User NOT found in database. Session ID: ${data.session.user.id}`);
      }
    } catch (error) {
      addLog(`Error checking user: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Error checking user status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const registerUser = async () => {
    setIsLoading(true);
    addLog('Registering user in database...');
    
    try {
      const response = await fetch('/api/debug/register-user', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        addLog(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        addLog(`User registered successfully: ${data.user.name} (${data.user.email})`);
      } else {
        addLog(`User registration skipped: ${data.message}`);
      }
      
      // Update user status
      await checkUserStatus();
    } catch (error) {
      addLog(`Error registering user: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Error registering user:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="mt-6 border-dashed border-orange-300 bg-orange-50/50">
      <CardHeader className="py-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center text-orange-600">
              <Bug className="mr-2 h-4 w-4" />
              Quiz Debug Panel
            </CardTitle>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-4 pb-2 text-sm">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={testSubmitResult}
                    disabled={isLoading || !onSubmitResult}
                  >
                    Test Submit (7/10)
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={checkQuizResults}
                    disabled={isLoading}
                  >
                    Check Saved Results
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setLogs([])}
                  >
                    Clear Logs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/debug/quiz-results', '_blank')}
                  >
                    Open Debug Page
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={checkUserStatus}
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Check User
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={registerUser}
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Register User
                  </Button>
                </div>
                
                <div className="max-h-40 overflow-y-auto p-2 bg-black/10 rounded-md font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground">No logs yet</div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="whitespace-pre-wrap">{log}</div>
                    ))
                  )}
                </div>
                
                {userStatus && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1">User Status:</h4>
                    <div className="p-2 rounded-md bg-black/10 text-xs">
                      <div className="flex items-center gap-2">
                        {userStatus.userInDatabase ? (
                          <><UserCheck className="h-4 w-4 text-green-600" /> User exists in database</>
                        ) : (
                          <><User className="h-4 w-4 text-red-600" /> User NOT found in database</>
                        )}
                      </div>
                      <div className="mt-1">
                        Session ID: <code className="text-xs break-all">{userStatus.session?.user?.id}</code>
                      </div>
                    </div>
                  </div>
                )}
                
                {results.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-1">Test Results:</h4>
                    <div className="max-h-40 overflow-y-auto p-2 bg-black/10 rounded-md font-mono text-xs">
                      {results.map((result, i) => (
                        <div key={i} className="mb-2">
                          <div>{new Date(result.timestamp).toLocaleTimeString()} - Score: {result.score}/{result.total}</div>
                          <pre>{JSON.stringify(result.result, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
} 