// This file is being renamed to `list/page.tsx`
// The content will be moved there.
'use client';
import ProtectedPage from "@/components/protected-page";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ProblemList } from "@/components/problem-list";
import { ProblemSolver } from "@/components/problem-solver";
import { Loader2 } from "lucide-react";
import { doc } from 'firebase/firestore';
import type { User as DbUser } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function ProblemsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: dbUser, isLoading: isDbUserLoading } = useDoc<DbUser>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !isDbUserLoading && dbUser) {
      if (dbUser.role === 'admin' || dbUser.role === 'teacher') {
        router.replace('/problems/list');
      }
    }
  }, [isUserLoading, isDbUserLoading, dbUser, router]);


  const renderContent = () => {
    if (isUserLoading || isDbUserLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!dbUser) {
      return null; // ProtectedPage will handle redirect
    }

    if (dbUser.role === 'student') {
      return <ProblemSolver />;
    }
    
    // Admins and teachers are redirected, but show loader until then.
    return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher", "student"]}>
      {renderContent()}
    </ProtectedPage>
  );
}
