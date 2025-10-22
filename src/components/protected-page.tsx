'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types';

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedPage({ children, allowedRoles }: ProtectedPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!allowedRoles.includes(user.role)) {
     // Redirect to their default page
     const roleRedirects: Record<UserRole, string> = {
        admin: '/dashboard',
        teacher: '/students',
        student: '/problems',
     };
     router.replace(roleRedirects[user.role]);
     return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p>권한이 없습니다. 리디렉션 중...</p>
          <Loader2 className="ml-2 h-6 w-6 animate-spin text-primary" />
        </div>
     );
  }

  return <AppLayout>{children}</AppLayout>;
}
