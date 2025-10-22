'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProtectedPage from "@/components/protected-page";
import { PageHeader } from "@/components/page-header";
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { LevelTest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const TEST_ID = 'reading';

export default function ReadingTestPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const testDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'levelTests', TEST_ID) : null
  , [firestore]);

  const { data: levelTestData, isLoading: isDataLoading } = useDoc<LevelTest>(testDocRef);

  const [time, setTime] = React.useState<number>(0);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (levelTestData) {
      setTime(levelTestData.totalTimeMinutes);
    }
  }, [levelTestData]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    const dataToSave: LevelTest = {
        id: TEST_ID,
        name: 'Reading',
        totalTimeMinutes: time
    };
    
    await setDocumentNonBlocking(doc(firestore, 'levelTests', TEST_ID), dataToSave, { merge: true });

    toast({
        title: "저장 완료",
        description: `시험 시간이 ${time}분으로 설정되었습니다.`
    });
    setIsSaving(false);
  };
  
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
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="flex items-center space-x-2">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="time">전체 시간(분)</Label>
                        <Input 
                            id="time"
                            type="number" 
                            value={time}
                            onChange={(e) => setTime(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
        </CardFooter>
      </Card>
    </ProtectedPage>
  );
}
