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
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { LevelTest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TEST_ID = 'reading';
const timeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function ReadingTestPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const testDocRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'levelTests', TEST_ID) : null
  , [firestore]);

  const { data: levelTestData, isLoading: isDataLoading } = useDoc<LevelTest>(testDocRef);

  const [selectedValue, setSelectedValue] = React.useState<string>('0');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (levelTestData) {
      setSelectedValue(String(levelTestData.totalTimeMinutes));
    }
  }, [levelTestData]);

  const handleSave = async () => {
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
    
    const fullDataToSave: LevelTest = {
        id: TEST_ID,
        name: levelTestData?.name || 'Reading',
        totalTimeMinutes: timeValue
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
