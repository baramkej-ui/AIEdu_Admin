'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { Users, BookOpen, UserCheck, BarChart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart } from "recharts";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { User, Problem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const chartData = [
  { month: "Jan", users: 186 },
  { month: "Feb", users: 305 },
  { month: "Mar", users: 237 },
  { month: "Apr", users: 73 },
  { month: "May", users: 209 },
  { month: "Jun", users: 214 },
];

const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function DashboardPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users')) : null
  , [firestore]);
  const { data: usersData, isLoading: usersLoading } = useCollection<User>(usersQuery);
  
  const problemsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'problems')) : null
  , [firestore]);
  const { data: problemsData, isLoading: problemsLoading } = useCollection<Problem>(problemsQuery);

  const isLoading = usersLoading || problemsLoading;

  const totalUsers = usersData?.length ?? 0;
  const totalProblems = problemsData?.length ?? 0;
  const totalTeachers = usersData?.filter(u => u.role === 'teacher').length ?? 0;
  const totalStudents = usersData?.filter(u => u.role === 'student').length ?? 0;

  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <PageHeader
        title="Dashboard"
        description="Overview of the EduQuiz platform."
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
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{totalProblems}</div>}
            <p className="text-xs text-muted-foreground">
              All problems created
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

      <div className="mt-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/> Monthly User Activity</CardTitle>
                <CardDescription>New user sign-ups over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <RechartsBarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
              )}
            </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
