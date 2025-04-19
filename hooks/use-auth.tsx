"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type UserRole = 'student' | 'teacher' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const router = useRouter();
  const pathname = usePathname();

  // On mount, check if user info exists in localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole && (storedRole === 'student' || storedRole === 'teacher')) {
      setUserRole(storedRole);
      setIsAuthenticated(true);
    } else if (pathname !== '/auth' && !pathname.includes('/_not-found')) {
      // If not authenticated and not on auth page, redirect to auth
      router.push('/auth');
    }
  }, [pathname, router]);

  const login = (role: UserRole) => {
    if (role) {
      localStorage.setItem('userRole', role);
      setUserRole(role);
      setIsAuthenticated(true);
      
      if (role === 'student') {
        router.push('/student/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
    setIsAuthenticated(false);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 