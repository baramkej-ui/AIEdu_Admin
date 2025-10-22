'use client';
import ProtectedPage from "@/components/protected-page";
import { ProblemList } from "@/components/problem-list";

export default function ProblemsListPage() {
  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <ProblemList />
    </ProtectedPage>
  );
}
