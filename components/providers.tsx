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
  const { isAuthenticated, userRole } = useAuth();
  const isMobile = useIsMobile();

  // Always render children - either directly or within the sidebar layout
  // This ensures consistent hook rendering
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If authenticated, render the sidebar layout
  return (
    <SidebarProvider>
      {isMobile && <MobileTopBar userRole={userRole === 'student' || userRole === 'teacher' ? userRole : undefined} />}
      <div className="min-h-screen flex w-full">
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
  );
} 