'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import type { User as DbUser } from '@/lib/types';
import { Skeleton } from "./ui/skeleton";

export function UserNav() {
  const auth = useAuth();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: dbUser, isLoading: isDbUserLoading } = useDoc<DbUser>(userDocRef);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (isUserLoading || isDbUserLoading || !dbUser) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={dbUser.avatarUrl} alt={dbUser.name} />
            <AvatarFallback>{getInitials(dbUser.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{dbUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {dbUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>프로필</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
