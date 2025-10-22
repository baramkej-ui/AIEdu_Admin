'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from "@/firebase";
import { collection, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { Problem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProblemForm } from '@/components/problem-form';
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
import type { LevelTest as LevelTestType } from '@/lib/types';


const TEST_ID = 'reading';
const timeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function ReadingTestPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const testDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'levelTests', TEST_ID) : null
  , [firestore]);

  const { data: levelTestData, isLoading: isDataLoading } = useDoc<LevelTestType>(testDocRef);

  const problemsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'problems') : null, [firestore]);
  const { data: allProblems, isLoading: areProblemsLoading } = useCollection<Problem>(problemsCollectionRef);

  const [selectedValue, setSelectedValue] = React.useState<string>('0');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedProblem, setSelectedProblem] = React.useState<Problem | undefined>(undefined);
  const [problemToDelete, setProblemToDelete] = React.useState<string | null>(null);

  const testProblems = React.useMemo(() => {
    if (!levelTestData || !levelTestData.problemIds || !allProblems) return [];
    return levelTestData.problemIds.map(id => allProblems.find(p => p.id === id)).filter((p): p is Problem => !!p).sort((a, b) => a.number - b.number);
  }, [levelTestData, allProblems]);

  React.useEffect(() => {
    if (levelTestData) {
      setSelectedValue(String(levelTestData.totalTimeMinutes));
    }
  }, [levelTestData]);

  const handleTimeSave = async () => {
    if (!firestore) return;
    const timeValue = parseInt(selectedValue, 10);
    if (isNaN(timeValue) || timeValue < 0) {
        toast({
            variant: 'destructive',
            title: "입력 오류",
            description: "유효한 시간을 선택해주세요."
        });
        return;
    }

    setIsSaving(true);
    
    const dataToUpdate = {
        totalTimeMinutes: timeValue
    };
    
    if(testDocRef) {
      setDocumentNonBlocking(testDocRef, dataToUpdate, { merge: true });
    }

    toast({
        title: "저장 완료",
        description: `시험 시간이 ${timeValue}분으로 설정되었습니다.`
    });
    setIsSaving(false);
  };
  
  const handleProblemSave = async (problemData: Omit<Problem, 'id'>, id?: string) => {
    if (!firestore) return;
    
    const problemId = id || `prob-${Date.now()}`;
    const problemDocRef = doc(firestore, 'problems', problemId);
    setDocumentNonBlocking(problemDocRef, { ...problemData, difficulty: 'easy'}, { merge: true }); // difficulty is required by type, but not used.

    if (!id && testDocRef) {
        setDocumentNonBlocking(testDocRef, { problemIds: arrayUnion(problemId) }, { merge: true });
    }

    toast({
      title: "성공",
      description: "문제가 성공적으로 저장되었습니다.",
    });
  };

  const handleEdit = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsFormOpen(true);
  };
  
  const handleCreate = () => {
    setSelectedProblem(undefined);
    setIsFormOpen(true);
  }

  const openDeleteDialog = (id: string) => {
    setProblemToDelete(id);
    setIsAlertOpen(true);
  }

  const handleDelete = async () => {
    if (problemToDelete && firestore && testDocRef) {
        // We only remove the reference, not delete the problem itself from the main 'problems' collection.
        setDocumentNonBlocking(testDocRef, { problemIds: arrayRemove(problemToDelete) }, { merge: true });
      
        toast({
            title: "삭제 완료",
            description: "테스트에서 문제가 제거되었습니다.",
        });
        setProblemToDelete(null);
    }
    setIsAlertOpen(false);
  };

  const getProblemTypeDescription = (problem: Problem) => {
    if (problem.type === 'multiple-choice') {
      return `객관식 / ${problem.options?.length ?? 0}지선다`;
    }
    if (problem.type === 'subjective') {
      if (problem.subType === 'short-answer') return '주관식 / 단답형';
      if (problem.subType === 'descriptive') return '주관식 / 서술형';
    }
    return '알 수 없음';
  };


  const isLoading = isDataLoading || areProblemsLoading;

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="Reading 레벨테스트 설정"
        description="시험 시간과 문제 목록을 관리합니다."
      />
      <Card>
        <CardHeader>
          <CardTitle>시험 시간 설정</CardTitle>
          <CardDescription>
            학생들이 Reading 레벨테스트를 완료해야 하는 전체 시간을 분 단위로 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isDataLoading ? (
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>데이터를 불러오는 중입니다...</span>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Label htmlFor="time-select" className="flex-shrink-0">전체 시간(분)</Label>
                    <Select
                        value={selectedValue}
                        onValueChange={setSelectedValue}
                    >
                      <SelectTrigger id="time-select" className="w-[180px]">
                        <SelectValue placeholder="시간 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={String(time)}>
                            {time}분
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleTimeSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        저장
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>문제 목록</CardTitle>
            <CardDescription>
              Reading 레벨테스트에 포함될 문제입니다. 총 {testProblems.length}개의 문제가 있습니다.
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              문제 추가
            </Button>
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
                  <TableHead className="w-[50px]">번호</TableHead>
                  <TableHead>문제</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testProblems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell>{problem.number}</TableCell>
                    <TableCell className="font-medium max-w-sm truncate">{problem.question}</TableCell>
                    <TableCell className="text-muted-foreground">{getProblemTypeDescription(problem)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(problem)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(problem.id)} className="text-destructive focus:text-destructive">
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
      
      <ProblemForm 
        problem={selectedProblem}
        onSave={handleProblemSave}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 이 테스트에서 문제를 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 이 문제는 테스트에서만 제거되며, 전체 문제 목록에서는 삭제되지 않습니다.
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
