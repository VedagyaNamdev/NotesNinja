'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BookOpenText,
  GraduationCap,
  Home,
  Menu,
  NotebookPen,
  Settings,
  Users,
  Calendar,
  Search,
  ClipboardList,
  FlaskConical,
  Library,
  X,
  LogOut
} from 'lucide-react';

interface AppSidebarProps {
  userRole?: 'student' | 'teacher';
}

const AppSidebar = ({ userRole: propUserRole }: AppSidebarProps) => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const pathname = usePathname();
  const { userRole: authUserRole, logout } = useAuth();
  const isMobile = useIsMobile();
  
  // Use the provided role from props, or fall back to the authenticated user role
  const userRole = propUserRole || authUserRole || 'student';

  const studentLinks = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/student/dashboard' },
    { name: 'Upload Notes', icon: <NotebookPen className="h-5 w-5" />, path: '/student/upload' },
    { name: 'Flashcards & Quizzes', icon: <BookOpenText className="h-5 w-5" />, path: '/student/flashcards' },
    { name: 'Revision Tracker', icon: <Calendar className="h-5 w-5" />, path: '/student/revision' },
    { name: 'My Notes', icon: <Search className="h-5 w-5" />, path: '/student/notes' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/student/settings' },
  ];

  const teacherLinks = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/teacher/dashboard' },
    { name: 'Upload Material', icon: <Library className="h-5 w-5" />, path: '/teacher/upload' },
    { name: 'Test Generator', icon: <FlaskConical className="h-5 w-5" />, path: '/teacher/test-generator' },
    { name: 'My Tests', icon: <ClipboardList className="h-5 w-5" />, path: '/teacher/tests' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/teacher/settings' },
  ];

  const links = userRole === 'student' ? studentLinks : teacherLinks;

  const handleLogout = () => {
    logout();
  };

  return (
    <div 
      className={cn(
        "h-full bg-card border-r border-border flex flex-col",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-4 flex items-center",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-2">
            {userRole === 'student' ? 
              <GraduationCap className="h-6 w-6 text-primary" /> : 
              <Users className="h-6 w-6 text-primary" />
            }
            <span className="font-bold text-lg">Note Companion</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {isCollapsed && !isMobile ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>
      
      <Separator />
      
      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-4">
          {!isCollapsed && (
            <div className="text-xs font-medium text-muted-foreground mb-4 px-1">
              {userRole === 'student' ? 'STUDENT' : 'TEACHER'} MENU
            </div>
          )}
          
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "flex items-center py-2.5 rounded-md text-sm font-medium transition-colors",
                  // On mobile, always show text even when collapsed
                  isCollapsed && !isMobile ? "justify-center px-2" : "px-3",
                  pathname === link.path
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.icon}
                {(!isCollapsed || isMobile) && <span className="ml-3">{link.name}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>
      
      <Separator className="mt-auto" />
      
      {/* User Profile */}
      <div className={cn(
        "p-4 flex items-center",
        isCollapsed && !isMobile ? "justify-center" : ""
      )}>
        {isCollapsed && !isMobile ? (
          <div className="flex flex-col gap-3 items-center">
            <Button variant="outline" size="icon" asChild className="rounded-full w-9 h-9 p-0">
              <Link href="/profile">
                <div className="rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold w-full h-full">
                  {userRole === 'student' ? 'S' : 'T'}
                </div>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground w-8 h-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {userRole === 'student' ? 'S' : 'T'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {userRole === 'student' ? 'Student User' : 'Teacher User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userRole === 'student' ? 'Student Account' : 'Teacher Account'}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSidebar;
