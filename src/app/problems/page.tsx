'use client';
import ProtectedPage from "@/components/protected-page";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ProblemList } from "@/components/problem-list";
import { ProblemSolver } from "@/components/problem-solver";
import { Loader2 } from "lucide-react";
import { doc } from 'firebase/firestore';
import type { User as DbUser } from '@/lib/types';


export default function ProblemsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: dbUser, isLoading: isDbUserLoading } = useDoc<DbUser>(userDocRef);

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

    if (dbUser.role === 'admin' || dbUser.role === 'teacher') {
      return <ProblemList />;
    }
    
    if (dbUser.role === 'student') {
      return <ProblemSolver />;
    }
    
    return <p>역할에 맞는 컨텐츠가 없습니다.</p>;
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher", "student"]}>
      {renderContent()}
    </ProtectedPage>
  );
}
