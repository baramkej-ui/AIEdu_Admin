'use client';
import ProtectedPage from "@/components/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { ProblemList } from "@/components/problem-list";
import { ProblemSolver } from "@/components/problem-solver";
import { Loader2 } from "lucide-react";

export default function ProblemsPage() {
  const { user, isLoading } = useAuth();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!user) {
      return null; // ProtectedPage will handle redirect
    }

    if (user.role === 'admin' || user.role === 'teacher') {
      return <ProblemList />;
    }
    
    if (user.role === 'student') {
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
