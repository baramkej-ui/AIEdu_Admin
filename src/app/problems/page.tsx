'use client';
import ProtectedPage from "@/components/protected-page";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
      router.push('/problems/role-play');
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

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      {renderContent()}
    </ProtectedPage>
  );
}
