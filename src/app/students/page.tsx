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
import { Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2, UserCog, Users, UserCheck } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, useFirebaseApp } from "@/firebase";
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
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';


const roleLabels: Record<UserRole, string> = {
  admin: 'Admins',
  teacher: 'Teachers',
  student: 'Students',
};

const UserTable = ({
  role,
  onAddUser,
  onEditUser,
  onDeleteUser,
  users,
  isLoading
}: {
  role: UserRole;
  onAddUser: (role: UserRole) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  users: User[] | null;
  isLoading: boolean;
}) => {
  const { user: authUser } = useUser();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>{roleLabels[role]} List</CardTitle>
                <CardDescription>There are a total of {users?.length ?? 0} {roleLabels[role].toLowerCase()}.</CardDescription>
            </div>
            {authUser?.uid && <Button onClick={() => onAddUser(role)}><PlusCircle className="mr-2"/>Add {roleLabels[role]}</Button>}
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
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteUser(user)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
};


export default function StudentsPage() {
  const firestore = useFirestore();
  const mainApp = useFirebaseApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<UserRole>("admin");

  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [defaultRole, setDefaultRole] = React.useState<UserRole>('admin');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', activeTab));
  }, [firestore, activeTab]);

  const { data: users, isLoading } = useCollection<User>(usersQuery);

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
    if (!firestore || !mainApp) {
      toast({ variant: 'destructive', title: "Error", description: "Database service is not available." });
      return;
    }
    
    if (id) { // Editing existing user
      const userDocRef = doc(firestore, 'users', id);
      const { password, ...updateData } = userData;
      setDocumentNonBlocking(userDocRef, updateData, { merge: true });
      // Note: Password/email updates in Auth for existing users would require re-authentication and is complex for this flow.
      // For now, we only update Firestore data.
      toast({
          title: "Success",
          description: "User information has been successfully updated."
      });

    } else { // Creating new user
        if (!userData.password) {
            throw new Error("Password is required for a new user.");
        }
        
        // Create a secondary app instance to create a user without signing out the current admin
        const secondaryAppName = `secondary-app-${Date.now()}`;
        const secondaryApp = initializeApp(mainApp.options, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
            const authUid = userCredential.user.uid;

            const newUser: User = {
                id: authUid,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                avatarUrl: `https://picsum.photos/seed/${authUid}/40/40`
            };
    
            const userDocRef = doc(firestore, "users", authUid);
            setDocumentNonBlocking(userDocRef, newUser, {});
          
            toast({
                title: "Success",
                description: "A new user has been successfully created."
            });

        } catch (error: any) {
            // Translate Firebase auth errors to user-friendly messages
            let errorMessage = error.message || "An unknown error occurred during user creation.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email address is already in use by another account.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "The email address is not valid.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "The password is too weak. It must be at least 6 characters long.";
            }
            // Re-throw the translated error message to be caught by the form
            throw new Error(errorMessage);
        } finally {
            // Clean up the secondary app instance
            await deleteApp(secondaryApp);
        }
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
        title: "Delete Simulation",
        description: "Actual deletion requires a backend function.",
    });
    setIsAlertOpen(false);
    setUserToDelete(null);
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="Member Management"
        description="View and manage users by role."
      />
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="teacher">Teachers</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-4">
          <UserTable
            role="admin"
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={openDeleteDialog}
            users={users}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="teacher" className="mt-4">
          <UserTable
            role="teacher"
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={openDeleteDialog}
            users={users}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="student" className="mt-4">
          <UserTable
            role="student"
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={openDeleteDialog}
            users={users}
            isLoading={isLoading}
          />
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
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user's data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedPage>
  );
}
