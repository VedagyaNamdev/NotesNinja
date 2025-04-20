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
import { useAuth } from '@/hooks/use-auth';
import { useNextAuth } from '@/hooks/use-auth-next';
import { signIn } from 'next-auth/react';

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const router = useRouter();
  const { login, isAuthenticated, userRole } = useAuth();
  const { session } = useNextAuth();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && userRole) {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);

  // If authenticated with NextAuth, handle session
  useEffect(() => {
    if (session) {
      // You can handle NextAuth session here
      console.log('NextAuth session:', session);
    }
  }, [session]);

  const handleContinue = () => {
    if (selectedRole) {
      login(selectedRole);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { 
      callbackUrl: '/auth',
      redirect: true
    });
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

  // Don't render the auth page if already authenticated
  if (isAuthenticated) {
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
                Smart Note Companion
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose your role to continue
              </CardDescription>
            </motion.div>
          </CardHeader>
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
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              disabled={!selectedRole}
              onClick={handleContinue}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}