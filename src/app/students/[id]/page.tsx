'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import type { User, LoginRecord } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function UserDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', params.id) : null, 
  [firestore, params.id]);
  const { data: user, isLoading: userLoading } = useDoc<User>(userDocRef);

  const loginHistoryQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users', params.id, 'loginHistory'), orderBy('timestamp', 'desc')) : null,
  [firestore, params.id]);
  const { data: loginHistory, isLoading: historyLoading } = useCollection<LoginRecord>(loginHistoryQuery);

  const isLoading = userLoading || historyLoading;

  if (isLoading) {
      return (
          <ProtectedPage allowedRoles={["admin", "teacher"]}>
              <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
          </ProtectedPage>
      );
  }

  if (!user) {
    notFound();
  }
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }
  
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(jsDate.getTime())) {
        return 'Invalid Date';
    }
    try {
        return format(jsDate, 'yyyy-MM-dd HH:mm:ss');
    } catch {
        return 'Date format error';
    }
  }
  
  if(user.role === 'student'){
    return (
       <ProtectedPage allowedRoles={["admin", "teacher"]}>
         <PageHeader
           title="Access Denied"
           description="Detailed login history is not available for students."
         />
       </ProtectedPage>
    )
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
       <PageHeader
        title="User Details"
        description={`Details and login history for ${user.name}.`}
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-lg font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                 <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Role:</span>
                        <span className="font-medium">{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Login:</span>
                        <span className="font-medium">{formatDate(user.lastLogin)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>Login History</CardTitle>
            <CardDescription>
                A record of the user's recent login times.
                Total {loginHistory?.length ?? 0} records.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Login ID</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loginHistory?.map((record) => (
                    <TableRow key={record.id}>
                        <TableCell className="font-medium">{formatDate(record.timestamp)}</TableCell>
                        <TableCell className="font-mono text-xs">{record.id}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
