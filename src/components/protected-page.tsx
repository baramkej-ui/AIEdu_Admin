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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Wait until the initial user loading is finished.
    if (isUserLoading) {
      return;
    }

    // If there is no authenticated user, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // If we don't have firestore instance, we can't verify role.
    if (!firestore) {
        // This case should ideally not happen if provider is set up correctly
        router.replace('/login');
        return;
    }

    const verifyUserRole = async () => {
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          const userRole = userData.role;

          if (userRole && allowedRoles.includes(userRole)) {
            setIsAuthorized(true);
          } else {
            // User has a role, but it's not allowed for this page.
            // Redirect them to their default page or login.
            const redirectPath = roleRedirects[userRole] || '/login';
            router.replace(redirectPath);
          }
        } else {
          // User is authenticated but has no data in Firestore.
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error verifying user role:", error);
        router.replace('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUserRole();

  }, [user, isUserLoading, router, firestore, allowedRoles]);

  if (isVerifying || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
     // This prevents a flash of content while redirecting.
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
