'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowRight, Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Role = "admin" | "teacher" | "student";

export default function StudentsPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  // Queries for each role
  const adminsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), where('role', '==', 'admin')) : null
  , [firestore]);
  const { data: admins, isLoading: adminsLoading } = useCollection<User>(adminsQuery);

  const teachersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), where('role', '==', 'teacher')) : null
  , [firestore]);
  const { data: teachers, isLoading: teachersLoading } = useCollection<User>(teachersQuery);

  const studentsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), where('role', '==', 'student')) : null
  , [firestore]);
  const { data: students, isLoading: studentsLoading } = useCollection<User>(studentsQuery);
  
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const isLoading = adminsLoading || teachersLoading || studentsLoading;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  }

  const handleDelete = () => {
    // Logic to delete user will be implemented here
    console.log("Deleting user:", userToDelete?.id);
    setIsAlertOpen(false);
    setUserToDelete(null);
  }

  const roleLabels: Record<Role, string> = {
    admin: '관리자',
    teacher: '교사',
    student: '학생',
  };

  const UserTable = ({
    users,
    role,
    isLoading,
  }: {
    users: User[] | null;
    role: Role;
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>{roleLabels[role]} 목록</CardTitle>
                <CardDescription>총 {users?.length ?? 0}명의 {roleLabels[role]}가 있습니다.</CardDescription>
            </div>
            {authUser?.uid && <Button><PlusCircle className="mr-2"/>{roleLabels[role]} 추가</Button>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead className="hidden md:table-cell">이메일</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="text-right">
                    {role === 'student' ? (
                       <Button asChild variant="ghost" size="sm">
                        <Link href={`/students/${user.id}`}>
                          진행 상황 보기 <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="구성원 관리"
        description="역할별 사용자 목록을 보고 관리하세요."
      />
      <Tabs defaultValue="student">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">학생</TabsTrigger>
          <TabsTrigger value="teacher">교사</TabsTrigger>
          <TabsTrigger value="admin">관리자</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-4">
          <UserTable users={students} role="student" isLoading={studentsLoading} />
        </TabsContent>
        <TabsContent value="teacher" className="mt-4">
          <UserTable users={teachers} role="teacher" isLoading={teachersLoading} />
        </TabsContent>
        <TabsContent value="admin" className="mt-4">
          <UserTable users={admins} role="admin" isLoading={adminsLoading} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 이 사용자를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 사용자 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedPage>
  );
}
