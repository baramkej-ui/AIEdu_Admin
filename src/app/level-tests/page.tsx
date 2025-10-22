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
import { Input } from "@/components/ui/input";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { Loader2, Save } from "lucide-react";
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { LevelTest, LevelTestCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const testCategories: LevelTestCategory[] = ["Writing", "Reading", "Speaking", "Listening"];

export default function LevelTestsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const levelTestsCollectionRef = useMemoFirebase(() => 
    firestore ? collection(firestore, 'level-tests') : null
  , [firestore]);
  const { data: levelTests, isLoading } = useCollection<LevelTest>(levelTestsCollectionRef);
  
  const [timeInputs, setTimeInputs] = React.useState<Record<LevelTestCategory, string>>({
    Writing: '',
    Reading: '',
    Speaking: '',
    Listening: '',
  });
  const [savingStates, setSavingStates] = React.useState<Record<LevelTestCategory, boolean>>({
    Writing: false,
    Reading: false,
    Speaking: false,
    Listening: false,
  });

  React.useEffect(() => {
    if (levelTests) {
      const initialTimes: Record<LevelTestCategory, string> = {
        Writing: '',
        Reading: '',
        Speaking: '',
        Listening: '',
      };
      levelTests.forEach(test => {
        if (test.id in initialTimes) {
          initialTimes[test.id as LevelTestCategory] = String(test.totalTime || '');
        }
      });
      // Set initial values for all categories, even if they don't exist in firestore yet
      testCategories.forEach(cat => {
        if (!initialTimes[cat]) {
            const foundTest = levelTests.find(t => t.id === cat);
            initialTimes[cat] = foundTest ? String(foundTest.totalTime) : '0';
        }
      });

      setTimeInputs(initialTimes);
    }
  }, [levelTests]);


  const handleTimeChange = (category: LevelTestCategory, value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setTimeInputs(prev => ({ ...prev, [category]: numValue }));
  };

  const handleSaveTime = async (category: LevelTestCategory) => {
    if (!firestore) return;
    
    const existingTest = levelTests?.find(t => t.id === category);
    const problemsToSave = existingTest?.problems || [];

    setSavingStates(prev => ({ ...prev, [category]: true }));
    
    const timeToSave = timeInputs[category] === '' ? 0 : parseInt(timeInputs[category], 10);
    const docRef = doc(firestore, 'level-tests', category);
    
    try {
      // Using a custom async version of setDocumentNonBlocking for toast handling
      await new Promise<void>((resolve, reject) => {
        setDoc(docRef, { id: category, totalTime: timeToSave, problems: problemsToSave }, { merge: true })
          .then(() => {
            toast({
              title: "저장 완료",
              description: `${category} 테스트의 전체 시간이 ${timeToSave}분으로 설정되었습니다.`,
            });
            resolve();
          })
          .catch((error) => {
            toast({
              variant: "destructive",
              title: "저장 실패",
              description: "시간을 저장하는 중 오류가 발생했습니다.",
            });
            reject(error);
          });
      });
    } catch (error) {
       // Errors are handled in the promise catch block
    } finally {
      setSavingStates(prev => ({ ...prev, [category]: false }));
    }
  };
  
  const getProblemCount = (category: LevelTestCategory) => {
    const test = levelTests?.find(t => t.id === category);
    return test?.problems?.length || 0;
  }

  return (
    <ProtectedPage allowedRoles={["admin"]}>
      <PageHeader
        title="레벨테스트 관리"
        description="분야별 레벨테스트의 시간 및 문제를 관리합니다."
      />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>분야</TableHead>
                  <TableHead>전체 시간(분)</TableHead>
                  <TableHead>현재 출제된 문제</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCategories.map((category) => (
                  <TableRow key={category}>
                    <TableCell className="font-semibold">{category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          pattern="[0-9]*"
                          value={timeInputs[category] ?? ''}
                          onChange={(e) => handleTimeChange(category, e.target.value)}
                          className="w-24"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveTime(category)}
                          disabled={savingStates[category]}
                        >
                          {savingStates[category] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getProblemCount(category)} 문제</TableCell>
                    <TableCell className="text-right">
                      <Button asChild>
                        <Link href={`/coming-soon`}>관리</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
