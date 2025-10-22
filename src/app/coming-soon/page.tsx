'use client';

import { PageHeader } from "@/components/page-header";
import ProtectedPage from "@/components/protected-page";
import { Construction } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <ProtectedPage allowedRoles={["admin", "teacher", "student"]}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Construction className="w-16 h-16 mb-4 text-primary" />
        <PageHeader 
            title="Coming Soon"
            description="현재 준비 중인 기능입니다. 잠시만 기다려주세요."
        />
      </div>
    </ProtectedPage>
  );
}
