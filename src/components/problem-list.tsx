'use client';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from "lucide-react";

import { problems as initialProblems } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { ProblemForm } from './problem-form';
import type { Problem } from '@/lib/types';
import { GenerateProblemsButton } from './generate-problems-button';
import { PageHeader } from './page-header';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProblemList() {
  const [problems, setProblems] = React.useState<Problem[]>(initialProblems);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [selectedProblem, setSelectedProblem] = React.useState<Problem | undefined>(undefined);
  const [problemToDelete, setProblemToDelete] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleSaveProblem = async (problemData: Problem) => {
    setProblems(prev => {
      const existing = prev.find(p => p.id === problemData.id);
      if (existing) {
        return prev.map(p => p.id === problemData.id ? problemData : p);
      }
      return [problemData, ...prev];
    });
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

  const handleDelete = () => {
    if (problemToDelete) {
      setProblems(prev => prev.filter(p => p.id !== problemToDelete));
      toast({
        title: "삭제 완료",
        description: "문제가 삭제되었습니다.",
      });
      setProblemToDelete(null);
    }
    setIsAlertOpen(false);
  };

  return (
    <>
      <PageHeader
        title="문제 관리"
        description="퀴즈 문제를 생성, 수정 및 관리합니다."
      >
        <div className='flex space-x-2'>
            <GenerateProblemsButton />
            <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 문제 생성
            </Button>
        </div>
      </PageHeader>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>질문</TableHead>
              <TableHead>주제</TableHead>
              <TableHead>난이도</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell className="font-medium max-w-sm truncate">{problem.question}</TableCell>
                <TableCell>{problem.topic}</TableCell>
                <TableCell>
                  <Badge variant={problem.difficulty === 'hard' ? 'destructive' : problem.difficulty === 'medium' ? 'secondary' : 'default'}>
                    {problem.difficulty}
                  </Badge>
                </TableCell>
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
      </div>

      <ProblemForm 
        problem={selectedProblem}
        onSave={handleSaveProblem}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 이 문제는 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
