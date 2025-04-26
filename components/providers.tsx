'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SidebarProvider, SidebarInset, Sidebar } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileTopBar from "@/components/layout/MobileTopBar";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import LoadingScreen from "./LoadingScreen";

// Create a client
const queryClient = new QueryClient();

// This component wraps the application with all the necessary providers
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppLayout>
            {children}
          </AppLayout>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

// AppLayout conditionally renders the sidebar based on authentication status
function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userRole, status } = useAuth();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  
  // Handle loading states
  useEffect(() => {
    // Start transition after authentication is confirmed
    if (status === 'authenticated' && isAuthenticated) {
      // Show loading for at least 1 second to ensure layout is prepared
      const timer = setTimeout(() => {
        setIsLoading(false);
        
        // Small delay before showing content to ensure smooth transition
        setTimeout(() => {
          setContentReady(true);
        }, 300);
      }, 1200);
      
      return () => clearTimeout(timer);
    } else if (status === 'unauthenticated') {
      // No need for loading screen if not authenticated
      setIsLoading(false);
      setContentReady(true);
    }
  }, [isAuthenticated, status]);
  
  // If authenticating, show loading screen
  if (status === 'loading' || (isLoading && isAuthenticated)) {
    return <LoadingScreen show={true} />;
  }

  // Always render children - either directly or within the sidebar layout
  // If not authenticated, render children directly
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If authenticated, render the sidebar layout
  return (
    <>
      {/* Keep loading screen until content is fully ready */}
      <LoadingScreen show={isLoading} />
      
      <SidebarProvider>
        {isMobile && <MobileTopBar userRole={userRole === 'student' || userRole === 'teacher' ? userRole : undefined} />}
        <div className={`min-h-screen flex w-full ${!contentReady ? 'invisible' : ''}`}>
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarInset className="bg-background">
            <div className="h-full max-w-7xl mx-auto">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
} 