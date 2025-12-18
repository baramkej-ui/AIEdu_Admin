'use client';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserRole, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

const roleRedirects: Record<UserRole, string> = {
  admin: '/dashboard',
  teacher: '/login', // Teachers are blocked and redirected to login
  student: '/login', // Students are blocked and redirected to login
};

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

    // If we don't have a firestore instance, we can't verify the role.
    if (!firestore) {
      // This case should ideally not happen if the provider is set up correctly
      router.replace('/login');
      return;
    }

    const fetchUserRole = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      
      // Non-blocking update for last login
      setDocumentNonBlocking(userDocRef, { lastLogin: new Date() }, { merge: true });

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          const userRole = userData.role;

          if (userRole === 'admin') {
              router.replace(roleRedirects.admin);
          } else {
              // Any other role is not allowed and should be signed out and redirected to login.
              await user.auth.signOut();
              router.replace('/login'); 
          }
        } else {
          // Handle case where user exists in Auth but not in Firestore.
          // Sign them out and redirect to login.
          await user.auth.signOut();
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error fetching user role, signing out:", error);
        await user.auth.signOut();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, isUserLoading, router, firestore]);
  
  // Show a loading spinner while verifying the user role.
  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render nothing while redirecting
  return null;
}
