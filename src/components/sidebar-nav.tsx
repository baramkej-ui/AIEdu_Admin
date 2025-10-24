'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Users, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as DbUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = {
  admin: [
    { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { href: '/level-tests', label: '레벨테스트 관리', icon: ClipboardList },
    { href: '/problems', label: '학습 관리', icon: BookOpen },
    { href: '/students', label: '구성원 관리', icon: Users },
  ],
  teacher: [
    { href: '/students', label: '구성원 관리', icon: Users },
    { href: '/problems', label: '학습 관리', icon: BookOpen },
    { href: '/level-tests', label: '레벨테스트 관리', icon: ClipboardList },
  ],
  student: [], // Student nav items are removed
};

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: dbUser, isLoading: isDbUserLoading } = useDoc<DbUser>(userDocRef);

  if (isUserLoading || isDbUserLoading || !dbUser) {
    // Optionally render a skeleton loader
    return null;
  }

  const userNavItems = navItems[dbUser.role] || [];

  return (
    <TooltipProvider>
      <nav className="flex flex-col gap-2">
        {userNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/dashboard');
          const Icon = item.icon;

          return isCollapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="h-10 w-10 justify-center p-2"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Icon className="mr-2 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
