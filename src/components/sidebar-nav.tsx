'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Users, Bot } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
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
    { href: '/students', label: '학생 관리', icon: Users },
    { href: '/problems', label: '문제 관리', icon: BookOpen },
  ],
  teacher: [
    { href: '/students', label: '학생 관리', icon: Users },
    { href: '/problems', label: '문제 관리', icon: BookOpen },
  ],
  student: [
    { href: '/problems', label: '문제 풀기', icon: BookOpen },
  ],
};

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const userNavItems = navItems[user.role];

  return (
    <TooltipProvider>
      <nav className="flex flex-col gap-2">
        {userNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
