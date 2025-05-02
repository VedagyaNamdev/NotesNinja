'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, GraduationCap, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileTopBarProps {
  userRole?: 'student' | 'teacher';
}

const MobileTopBar = ({ userRole: propUserRole }: MobileTopBarProps) => {
  const { toggleSidebar, openMobile } = useSidebar();
  const { userRole: authUserRole, logout, user } = useAuth();
  
  // Use the provided role from props, or fall back to the authenticated user role
  const userRole = propUserRole || authUserRole || 'student';

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] h-14 bg-background border-b border-border shadow-sm flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleSidebar}
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <div className="text-sm font-semibold">
            Notes Ninja
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="w-full h-full">
                <AvatarImage src={user?.image || ''} alt={user?.name || 'Profile'} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.name?.charAt(0) || (userRole === 'student' ? 'S' : 'T')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ''} alt={user?.name || 'Profile'} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.name?.charAt(0) || (userRole === 'student' ? 'S' : 'T')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.name || (userRole === 'student' ? 'Student User' : 'Teacher User')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userRole === 'student' ? 'Student Account' : 'Teacher Account'}
                </span>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/profile">View Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default MobileTopBar; 