'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { Users, UserCog, UserCheck } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from 'react';

const DashboardContent = () => {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users')) : null
  , [firestore]);
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(usersQuery);
  
  const isLoading = usersLoading;

  const totalUsers = usersData?.length ?? 0;
  const totalAdmins = usersData?.filter(u => u.role === 'admin').length ?? 0;
  const totalTeachers = usersData?.filter(u => u.role === 'teacher').length ?? 0;
  const totalStudents = usersData?.filter(u => u.role === 'student').length ?? 0;
  
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the AIEdu platform."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{totalUsers}</div>}
            <p className="text-xs text-muted-foreground">
              All roles on the platform included
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Number of Admins</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{totalAdmins}</div>}
            <p className="text-xs text-muted-foreground">
              Active admin accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Number of Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{totalTeachers}</div>}
            <p className="text-xs text-muted-foreground">
              Active teacher accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Number of Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{totalStudents}</div>}
            <p className="text-xs text-muted-foreground">
              Active student accounts
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


export default function DashboardPage() {
  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <DashboardContent />
    </ProtectedPage>
  );
}
