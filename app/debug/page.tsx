"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Server, BrainCircuit, BookOpen, Users, Settings } from 'lucide-react';

export default function DebugPage() {
  const { isAuthenticated, userRole, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
        <p>Please log in to access the debug tools.</p>
      </div>
    );
  }

  const debugTools = [
    {
      title: 'Quiz Results Debug',
      description: 'Test and diagnose issues with quiz results saving',
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      href: '/debug/quiz-results',
    },
    {
      title: 'Database Structure',
      description: 'Check database tables and schema',
      icon: <Database className="h-8 w-8 text-primary" />,
      href: '/api/debug/db-structure',
      apiCall: true,
    },
    {
      title: 'Database Connection',
      description: 'Test database connection',
      icon: <Server className="h-8 w-8 text-primary" />,
      href: '/api/debug/db-connection',
      apiCall: true,
    },
    {
      title: 'Auth Status',
      description: 'View current authentication status',
      icon: <Users className="h-8 w-8 text-primary" />,
      href: '/api/auth/session',
      apiCall: true,
    },
    {
      title: 'User Status',
      description: 'Check if current user exists in database',
      icon: <Users className="h-8 w-8 text-primary" />,
      href: '/api/debug/check-user',
      apiCall: true,
    }
  ];

  // Function to register the current user in the database
  const registerUser = async () => {
    try {
      const response = await fetch('/api/debug/register-user', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`User registration ${data.success ? 'successful' : 'failed'}: ${data.message}`);
        console.log('User registration result:', data);
      } else {
        alert(`Error: ${data.error}\n${data.details || ''}`);
        console.error('User registration error:', data);
      }
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. See console for details.');
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify({
              id: user?.id,
              email: user?.email,
              name: user?.name,
              role: userRole,
              isAuthenticated
            }, null, 2)}
          </pre>
          <div className="mt-4">
            <Button 
              onClick={registerUser} 
              className="w-full"
            >
              Register User in Database
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Use this to add your authenticated user to the database if quiz results aren't saving
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debugTools.map((tool, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              {tool.icon}
              <CardTitle className="text-base">{tool.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
              {tool.apiCall ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(tool.href, '_blank')}
                >
                  View API Response
                </Button>
              ) : (
                <Link href={tool.href} passHref>
                  <Button className="w-full">Open Tool</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>These tools are intended for development and debugging only.</p>
        <p>Some debug endpoints are restricted in production environments.</p>
      </div>
    </div>
  );
} 