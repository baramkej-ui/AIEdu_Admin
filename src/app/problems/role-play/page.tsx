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
      toast({ variant: 'destructive', title: "Error", description: "Database service is not available." });
      return;
    }
    
    const scenarioId = id || `scenario-${Date.now()}`;
    const docRef = doc(firestore, 'rolePlayScenarios', scenarioId);
    
    setDocumentNonBlocking(docRef, scenarioData, { merge: true });

    toast({
        title: "Success",
        description: "The scenario has been saved successfully."
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
          title: "Deletion Complete",
          description: "The scenario has been deleted.",
      });
      setScenarioToDelete(null);
    }
    setIsAlertOpen(false);
  }

  return (
    <ProtectedPage allowedRoles={["admin", "teacher"]}>
      <PageHeader
        title="Role-Play Scenario Management"
        description="Manage the Role-Play scenarios for students to practice."
      >
        <Button onClick={handleAddScenario}><PlusCircle className="mr-2"/>Add New Scenario</Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Scenario List</CardTitle>
          <CardDescription>There are a total of {scenarios?.length ?? 0} scenarios.</CardDescription>
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
                  <TableHead>Place</TableHead>
                  <TableHead>Situation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditScenario(scenario)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(scenario.id)} className="text-destructive focus:text-destructive">
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
      
      <RolePlayForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        scenario={scenarioToEdit}
        onSave={handleSaveScenario}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The scenario data will be permanently deleted.
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
