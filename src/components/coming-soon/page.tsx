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
            description="This feature is currently under construction. Please check back later."
        />
      </div>
    </ProtectedPage>
  );
}
