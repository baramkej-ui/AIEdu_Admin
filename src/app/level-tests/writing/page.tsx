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


const TEST_ID = 'writing';
const timeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function WritingTestPage() {
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
            title: "Input Error",
            description: "Please select a valid time."
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
        title: "Save Complete",
        description: `The test duration has been set to ${timeValue} minutes.`
    });
    setIsSaving(false);
  };
  
  const handleProblemSave = async (problemData: Omit<Problem, 'id'>, id?: string) => {
    if (!firestore) return;
    
    const problemId = id || `prob-${Date.now()}`;
    const problemDocRef = doc(firestore, 'problems', problemId);
    
    const { ...restData } = problemData as any; 
    setDocumentNonBlocking(problemDocRef, restData, { merge: true });

    if (!id && testDocRef) {
        setDocumentNonBlocking(testDocRef, { problemIds: arrayUnion(problemId) }, { merge: true });
    }

    toast({
      title: "Success",
      description: "The problem has been saved successfully.",
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
        
        setDocumentNonBlocking(testDocRef, { problemIds: arrayRemove(problemToDelete) }, { merge: true });
      
        toast({
            title: "Deletion Complete",
            description: "The problem has been removed from the test.",
        });
        setProblemToDelete(null);
    }
    setIsAlertOpen(false);
  };

  const getProblemTypeDescription = (problem: Problem) => {
    if (problem.type === 'multiple-choice') {
      return `Multiple Choice / ${problem.options?.length ?? 0} options`;
    }
    if (problem.type === 'subjective') {
      if (problem.subType === 'short-answer') return 'Subjective / Short Answer';
      if (problem.subType === 'descriptive') return 'Subjective / Descriptive';
    }
    return 'Unknown';
  };


  const isLoading = isDataLoading || areProblemsLoading;

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="Writing Level Test Settings"
        description="Manage the test duration and problem list."
      />
      <Card>
        <CardHeader>
          <CardTitle>Test Duration Settings</CardTitle>
          <CardDescription>
            Set the total time in minutes that students have to complete the Writing level test.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isDataLoading ? (
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading data...</span>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Label htmlFor="time-select" className="flex-shrink-0">Total Time (minutes)</Label>
                    <Select
                        value={selectedValue}
                        onValueChange={setSelectedValue}
                    >
                      <SelectTrigger id="time-select" className="w-[180px]">
                        <SelectValue placeholder="Select time..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={String(time)}>
                            {time} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleTimeSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Problem List</CardTitle>
            <CardDescription>
              Problems included in the Writing level test. There are {testProblems.length} problems in total.
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Problem
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
                  <TableHead className="w-[50px]">No.</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(problem)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(problem.id)} className="text-destructive focus:text-destructive">
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
      
      <ProblemForm 
        problem={selectedProblem}
        onSave={handleProblemSave}
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this problem from the test?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will only remove the problem from the test, not delete it from the overall problem list.
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
