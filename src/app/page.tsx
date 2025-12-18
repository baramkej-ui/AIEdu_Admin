'use client';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserRole, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';

const roleRedirects: Record<UserRole, string> = {
  admin: '/dashboard',
  teacher: '/students',
  student: '/problems',
};

export default function HomePage() {
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
      const userDocRef = doc(firestore, 'users', user.uid);
      
      // Non-blocking update for last login
      setDocumentNonBlocking(userDocRef, { lastLoginAt: new Date() }, { merge: true });

      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setDbUser(userData);
        if (userData.role === 'admin' || userData.role === 'teacher') {
            router.replace(roleRedirects[userData.role]);
        } else {
            // Non-admin/teacher users are logged out and redirected.
            router.replace('/login'); 
        }
      } else {
        // Handle case where user exists in Auth but not in Firestore
        // For now, redirect to login
        router.replace('/login');
      }
    };

    fetchUserRole().finally(() => setIsLoading(false));
  }, [user, isUserLoading, router, firestore]);
  
  if (isLoading || isUserLoading || !dbUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return null;
}
