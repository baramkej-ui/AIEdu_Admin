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
import { Badge } from "@/components/ui/badge";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Percent, Target } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import type { User, Problem, StudentProgress } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";


export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', params.id) : null, 
  [firestore, params.id]);
  const { data: student, isLoading: studentLoading } = useDoc<User>(studentDocRef);

  const progressQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'studentProgress'), where('studentId', '==', params.id)) : null,
  [firestore, params.id]);
  const { data: studentProgress, isLoading: progressLoading } = useCollection<StudentProgress>(progressQuery);

  const problemsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'problems') : null,
  [firestore]);
  const { data: problems, isLoading: problemsLoading } = useCollection<Problem>(problemsQuery);

  const isLoading = studentLoading || progressLoading || problemsLoading;

  if (isLoading) {
      return (
          <ProtectedPage allowedRoles={["admin", "teacher"]}>
              <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
          </ProtectedPage>
      );
  }

  if (!student) {
    notFound();
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const progressData = studentProgress || [];
  const allProblems = problems || [];

  const solvedCount = progressData.filter(p => p.solved).length;
  const correctCount = progressData.filter(p => p.correct).length;
  const accuracy = solvedCount > 0 ? (correctCount / solvedCount) * 100 : 0;
  const totalTime = progressData.reduce((acc, p) => acc + p.timeTaken, 0);
  const avgTime = solvedCount > 0 ? totalTime / solvedCount : 0;

  const pieData = [
    { name: '정답', value: correctCount },
    { name: '오답', value: solvedCount - correctCount },
  ];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title={student.name}
        description={`${student.email} 님의 학습 진행 상황입니다.`}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정확도</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              푼 문제 중 정답 비율
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">푼 문제</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solvedCount} / {allProblems.length}</div>
            <p className="text-xs text-muted-foreground">
              전체 문제 중 해결한 문제
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 해결 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTime.toFixed(1)}초</div>
            <p className="text-xs text-muted-foreground">
              문제당 평균 소요 시간
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">정답/오답 분포</CardTitle>
            </CardHeader>
            <CardContent className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>최근에 푼 문제 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>문제</TableHead>
                <TableHead>결과</TableHead>
                <TableHead>소요 시간(초)</TableHead>
                <TableHead>난이도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressData.map((p) => {
                const problem = allProblems.find(pr => pr.id === p.problemId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{problem?.question || '삭제된 문제'}</TableCell>
                    <TableCell>
                      {p.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>{p.timeTaken}</TableCell>
                    <TableCell>
                        {problem ? <Badge variant={problem.difficulty === 'hard' ? 'destructive' : problem.difficulty === 'medium' ? 'secondary' : 'default'}>
                            {problem.difficulty}
                        </Badge> : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
