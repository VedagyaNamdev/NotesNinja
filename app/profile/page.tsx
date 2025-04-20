"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, LogOut, Mail } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { isAuthenticated, userRole, logout, user } = useAuth();
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
          <div className="mx-auto mb-4">
            <Avatar className="h-24 w-24">
              {user?.image ? (
                <AvatarImage src={user.image} alt={user.name || 'Profile'} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {user?.name?.charAt(0) || (userRole === 'student' ? 'S' : 'T')}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <CardTitle className="text-2xl">
            {user?.name || (userRole === 'student' ? 'Student User' : 'Teacher User')}
          </CardTitle>
          <CardDescription>
            You are logged in as a {userRole === 'student' ? 'Student' : 'Teacher'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
          
          <Separator />
          
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