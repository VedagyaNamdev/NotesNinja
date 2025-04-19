"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const router = useRouter();

  // If not authenticated, redirect to auth page
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !userRole) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
            {userRole === 'student' ? (
              <GraduationCap className="h-10 w-10 text-primary" />
            ) : (
              <Users className="h-10 w-10 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          <CardDescription>
            You are logged in as a {userRole === 'student' ? 'Student' : 'Teacher'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Account Type</h3>
            <p className="text-sm text-muted-foreground">
              {userRole === 'student' ? 'Student Account' : 'Teacher Account'}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Access</h3>
            <p className="text-sm text-muted-foreground">
              {userRole === 'student' 
                ? 'You have access to student features like uploading notes, creating flashcards, and tracking revisions.' 
                : 'You have access to teacher features like uploading material, creating tests, and monitoring student progress.'}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 