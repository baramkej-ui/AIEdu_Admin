'use client';
import ProtectedPage from "@/components/protected-page";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ProblemSolver } from "@/components/problem-solver";
import { Loader2 } from "lucide-react";
import { doc } from 'firebase/firestore';
import type { User as DbUser } from '@/lib/types';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

const problemTypes = ["Role-Play"];

export default function ProblemsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: dbUser, isLoading: isDbUserLoading } = useDoc<DbUser>(userDocRef);

  const handleButtonClick = (type: string) => {
    if (type === 'Role-Play') {
      router.push('/coming-soon');
    }
  };

  const renderContent = () => {
    if (isUserLoading || isDbUserLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!dbUser) {
      // This case should be handled by ProtectedPage, but as a fallback:
      return null;
    }

    if (dbUser.role === 'admin' || dbUser.role === 'teacher') {
      return (
        <>
          <PageHeader
            title="학습 관리"
            description="관리할 학습 유형을 선택하세요."
          />
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {problemTypes.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-24 text-lg"
                    onClick={() => handleButtonClick(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      );
    }

    if (dbUser.role === 'student') {
      return <ProblemSolver />;
    }
    
    // Fallback for any other case
    return (
        <div className="flex h-full w-full items-center justify-center">
          <p>역할에 맞는 페이지를 찾을 수 없습니다.</p>
        </div>
      );
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher", "student"]}>
      {renderContent()}
    </ProtectedPage>
  );
}
