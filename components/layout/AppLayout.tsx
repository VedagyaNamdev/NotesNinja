'use client';

import React, { ReactNode, useEffect } from 'react';
import AppSidebar from './AppSidebar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
  userRole?: 'student' | 'teacher';
}

const AppLayout = ({ children, userRole: propUserRole }: AppLayoutProps) => {
  const { isAuthenticated, userRole: authUserRole } = useAuth();
  const router = useRouter();
  
  // Use the provided role from props, or fall back to the authenticated user role
  const userRole = propUserRole || authUserRole;
  
  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);
  
  // Render a loading state or nothing while checking authentication
  if (!isAuthenticated || !userRole) {
    return null;
  }
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar userRole={userRole} />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex-1 overflow-auto",
          "bg-background"
        )}
      >
        <div className="container mx-auto p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default AppLayout; 