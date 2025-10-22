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

  // inputValue는 사용자 입력을 위한 로컬 상태입니다.
  const [inputValue, setInputValue] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Firestore에서 데이터를 처음 로드할 때만 inputValue를 설정합니다.
  React.useEffect(() => {
    if (levelTestData) {
      setInputValue(String(levelTestData.totalTimeMinutes));
    }
  }, [levelTestData]);

  const handleSave = async () => {
    if (!firestore) return;
    const timeValue = parseInt(inputValue, 10);
    if (isNaN(timeValue) || timeValue < 0) {
        toast({
            variant: 'destructive',
            title: "입력 오류",
            description: "유효한 숫자를 입력해주세요."
        });
        return;
    }

    setIsSaving(true);
    const dataToSave: Partial<LevelTest> = {
        totalTimeMinutes: timeValue
    };
    
    // id와 name을 포함하여 LevelTest 타입에 맞게 객체를 구성합니다.
    const fullDataToSave: LevelTest = {
        id: TEST_ID,
        name: levelTestData?.name || 'Reading', // 기존 이름 사용 또는 기본값
        ...dataToSave
    };
    
    await setDocumentNonBlocking(doc(firestore, 'levelTests', TEST_ID), fullDataToSave, { merge: true });

    toast({
        title: "저장 완료",
        description: `시험 시간이 ${timeValue}분으로 설정되었습니다.`
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
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>데이터를 불러오는 중입니다...</span>
                </div>
            ) : (
                <div className="flex items-center space-x-2">
                    <Label htmlFor="time" className="flex-shrink-0">전체 시간(분)</Label>
                    <Input 
                        id="time"
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-24"
                    />
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        저장
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </ProtectedPage>
  );
}
