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
import { Button } from "@/components/ui/button";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { RolePlayScenario } from "@/lib/types";
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
import { useToast } from '@/hooks/use-toast';
import { RolePlayForm } from '@/components/role-play-form';

export default function RolePlayPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const scenariosQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'rolePlayScenarios') : null
  , [firestore]);

  const { data: scenarios, isLoading } = useCollection<RolePlayScenario>(scenariosQuery);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [scenarioToEdit, setScenarioToEdit] = React.useState<RolePlayScenario | undefined>(undefined);
  const [scenarioToDelete, setScenarioToDelete] = React.useState<string | null>(null);

  const handleAddScenario = () => {
    setScenarioToEdit(undefined);
    setIsFormOpen(true);
  }

  const handleEditScenario = (scenario: RolePlayScenario) => {
    setScenarioToEdit(scenario);
    setIsFormOpen(true);
  }
  
  const handleSaveScenario = async (scenarioData: Omit<RolePlayScenario, 'id'>, id?: string) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: "오류", description: "데이터베이스 서비스를 사용할 수 없습니다." });
      return;
    }
    
    const scenarioId = id || `scenario-${Date.now()}`;
    const docRef = doc(firestore, 'rolePlayScenarios', scenarioId);
    
    setDocumentNonBlocking(docRef, scenarioData, { merge: true });

    toast({
        title: "성공",
        description: "상황 정보가 성공적으로 저장되었습니다."
    });
  }

  const openDeleteDialog = (id: string) => {
    setScenarioToDelete(id);
    setIsAlertOpen(true);
  }

  const handleDelete = () => {
    if (scenarioToDelete && firestore) {
      const docRef = doc(firestore, 'rolePlayScenarios', scenarioToDelete);
      deleteDocumentNonBlocking(docRef);
      toast({
          title: "삭제 완료",
          description: "상황이 삭제되었습니다.",
      });
      setScenarioToDelete(null);
    }
    setIsAlertOpen(false);
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="Role-Play 상황 관리"
        description="학생들이 연습할 Role-Play 상황을 관리합니다."
      >
        <Button onClick={handleAddScenario}><PlusCircle className="mr-2"/>새로운 상황 추가</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>상황 목록</CardTitle>
          <CardDescription>총 {scenarios?.length ?? 0}개의 상황이 있습니다.</CardDescription>
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
                  <TableHead>장소</TableHead>
                  <TableHead>상황</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios?.map((scenario) => (
                  <TableRow key={scenario.id}>
                    <TableCell className="font-medium">{scenario.place}</TableCell>
                    <TableCell className="max-w-sm truncate">{scenario.situation}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditScenario(scenario)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(scenario.id)} className="text-destructive focus:text-destructive">
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
      
      <RolePlayForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        scenario={scenarioToEdit}
        onSave={handleSaveScenario}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 이 상황을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 상황 데이터가 영구적으로 삭제됩니다.
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
