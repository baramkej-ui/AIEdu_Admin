'use client';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/app-layout';
import { Loader2 } from 'lucide-react';
import type { UserRole, User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const roleRedirects: Record<UserRole, string> = {
  admin: '/dashboard',
  teacher: '/students',
  student: '/login', // Students can't log in, redirect to login
};

export default function ProtectedPage({ children, allowedRoles }: ProtectedPageProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchUserRole = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setDbUser(userData);
        if (!allowedRoles.includes(userData.role)) {
          router.replace(roleRedirects[userData.role] || '/login');
        }
      } else {
        router.replace('/login');
      }
      setIsLoading(false);
    };

    fetchUserRole();
  }, [user, isUserLoading, router, firestore, allowedRoles]);

  if (isUserLoading || isLoading || !dbUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowedRoles.includes(dbUser.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p>You do not have permission. Redirecting...</p>
        <Loader2 className="ml-2 h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
