'use client';
import * as React from 'react';
import { BookOpenCheck, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="relative flex min-h-screen w-full">
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-card transition-all',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-primary">AIEdu (Admin)</h1>
          )}
          <BookOpenCheck
            className={cn('h-6 w-6 text-primary', isCollapsed && 'mx-auto')}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
           <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <PanelRight /> : <PanelLeft />}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
