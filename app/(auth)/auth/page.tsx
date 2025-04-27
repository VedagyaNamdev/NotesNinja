"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [step, setStep] = useState<'role' | 'provider'>('role');
  const router = useRouter();
  const { 
    isAuthenticated, 
    userRole, 
    user, 
    updateRole, 
    isUpdatingRole 
  } = useAuth();

  // If already authenticated with a role, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole) {
        // User has a role, redirect to the dashboard
        console.log(`User authenticated with role ${userRole}, redirecting to dashboard`);
        router.push(`/${userRole}/dashboard?noredirect=true`);
      } else {
        // User is authenticated but doesn't have a role
        console.log('User authenticated without role, redirecting to dashboard-redirect');
        router.push('/dashboard-redirect?noredirect=true');
      }
    }
  }, [isAuthenticated, userRole, router]);

  // Handle role selection - move to provider selection
  const handleRoleContinue = async () => {
    if (!selectedRole) return;
    
    if (user) {
      // User is already authenticated, just update role
      const success = await updateRole(selectedRole);
      if (!success) {
        // If role update failed, show error
        toast.error("Error updating role", {
          description: "Please try again"
        });
      }
    } else {
      // Move to provider selection
      setStep('provider');
    }
  };

  // Handle provider selection
  const handleProviderSelect = (provider: 'google' | 'github') => {
    // Set direct dashboard redirect with role parameter
    const role = selectedRole || 'student';
    const callbackUrl = `/${role}/dashboard?role=${role}&noredirect=true`;
    signIn(provider, { callbackUrl, redirect: true });
  };

  // Go back to role selection
  const handleBackToRole = () => {
    setStep('role');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Don't render the auth page if already authenticated with a role
  if (isAuthenticated && userRole) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <CardTitle className="text-2xl font-bold tracking-tight">
                Notes Ninja
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {step === 'role' 
                  ? 'Choose your role to continue' 
                  : 'Choose how to sign in'}
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          {step === 'role' ? (
            <>
              <CardContent className="space-y-4">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-4"
                >
                  <motion.div variants={item}>
                    <Card 
                      className={`cursor-pointer hover-scale ${selectedRole === 'student' ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => setSelectedRole('student')}
                    >
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <GraduationCap className="h-8 w-8 text-primary-blue" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg">Student</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload notes, study with flashcards, and track your progress
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={item}>
                    <Card 
                      className={`cursor-pointer hover-scale ${selectedRole === 'teacher' ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => setSelectedRole('teacher')}
                    >
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-full">
                          <Users className="h-8 w-8 text-primary-purple" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg">Teacher</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload materials and generate tests for your students
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={!selectedRole || isUpdatingRole}
                  onClick={handleRoleContinue}
                >
                  {isUpdatingRole ? 'Updating...' : 'Continue'}
                  {!isUpdatingRole && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  You've selected the <strong>{selectedRole}</strong> role.
                </p>
                
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleProviderSelect('google')}
                  >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Sign in with Google
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleProviderSelect('github')}
                  >
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                      <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
                    </svg>
                    Sign in with GitHub
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost"
                  onClick={handleBackToRole}
                  className="w-full"
                >
                  Go back to role selection
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}