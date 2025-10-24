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
import { Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import type { User, UserRole } from "@/lib/types";
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
import { UserForm } from "@/components/user-form";
import { useToast } from '@/hooks/use-toast';
import { createFirebaseAuthUser } from '@/ai/flows/create-firebase-auth-user';


export default function StudentsPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<UserRole>("admin");

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', activeTab));
  }, [firestore, activeTab]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [defaultRole, setDefaultRole] = React.useState<UserRole>('admin');

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  const handleAddUser = (role: UserRole) => {
    setUserToEdit(undefined);
    setDefaultRole(role);
    setIsFormOpen(true);
  }

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  }
  
  const handleSaveUser = async (userData: any, id?: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: "오류", description: "데이터베이스 서비스를 사용할 수 없습니다." });
      return;
    }
    
    if (id) { // Editing existing user
      const userDocRef = doc(firestore, 'users', id);
      const { password, ...updateData } = userData;
      setDocumentNonBlocking(userDocRef, updateData, { merge: true });
      // Note: Password/email updates in Auth for existing users would require re-authentication and is complex for this flow.
      // For now, we only update Firestore data.
      toast({
          title: "성공",
          description: "사용자 정보가 성공적으로 업데이트되었습니다."
      });

    } else { // Creating new user
        if (!userData.password) {
            throw new Error("새 사용자에게는 비밀번호가 필요합니다.");
        }
        
        // 1. Create user in Firebase Auth via Genkit Flow
        const authResult = await createFirebaseAuthUser({ email: userData.email, password: userData.password });

        if (!authResult.uid) {
            throw new Error(authResult.error || "Firebase Auth에서 사용자 생성에 실패했습니다.");
        }

        // 2. Create user in Firestore with the UID from Auth
        const newUser: User = {
            id: authResult.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            avatarUrl: `https://picsum.photos/seed/${authResult.uid}/40/40`
        };

        const userDocRef = doc(firestore, "users", authResult.uid);
        setDocumentNonBlocking(userDocRef, newUser, {});
      
        toast({
            title: "성공",
            description: "새로운 사용자가 성공적으로 생성되었습니다."
        });
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  }

  const handleDelete = () => {
    // Logic to delete user would need a backend function for security.
    // For now, it only closes the dialog.
    console.log("Deleting user (simulation):", userToDelete?.id);
    toast({
        title: "삭제 시뮬레이션",
        description: "실제 삭제는 백엔드 기능이 필요합니다.",
    });
    setIsAlertOpen(false);
    setUserToDelete(null);
  }

  const roleLabels: Record<UserRole, string> = {
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
    role: UserRole;
    isLoading: boolean;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>{roleLabels[role]} 목록</CardTitle>
                <CardDescription>총 {users?.length ?? 0}명의 {roleLabels[role]}가 있습니다.</CardDescription>
            </div>
            {authUser?.uid && <Button onClick={() => handleAddUser(role)}><PlusCircle className="mr-2"/>{roleLabels[role]} 추가</Button>}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">메뉴 열기</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin">관리자</TabsTrigger>
          <TabsTrigger value="teacher">교사</TabsTrigger>
          <TabsTrigger value="student">학생</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-4">
          <UserTable users={users} role="admin" isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="teacher" className="mt-4">
          <UserTable users={users} role="teacher" isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="student" className="mt-4">
          <UserTable users={users} role="student" isLoading={isLoading} />
        </TabsContent>
      </Tabs>
      
      <UserForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        user={userToEdit}
        onSave={handleSaveUser}
        defaultRole={defaultRole}
      />

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
