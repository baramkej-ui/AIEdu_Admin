'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '@/lib/types';
import { users } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, role: UserRole) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('eduquiz-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('eduquiz-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, role: UserRole) => {
    setIsLoading(true);
    // This is a mock login. In a real app, you'd call an API.
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('eduquiz-user', JSON.stringify(foundUser));
    } else {
      throw new Error('이메일 또는 역할이 일치하지 않습니다.');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eduquiz-user');
  };

  const signup = async (name: string, email: string, role: UserRole) => {
    // This is a mock signup. In a real app, you'd call an API.
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/40/40`
    };
    users.push(newUser); // Note: this only adds to the in-memory array
    setUser(newUser);
    localStorage.setItem('eduquiz-user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}
