'use client';

import * as React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  generateNewProblems,
  GenerateNewProblemsOutput,
} from '@/ai/flows/generate-new-problems';

export function GenerateProblemsButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [generatedProblems, setGeneratedProblems] =
    React.useState<GenerateNewProblemsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedProblems(null);
    try {
      // Mock input for the AI flow
      const input = {
        studentId: 'student-1',
        solvedProblems: ['prob-1'],
        recentProblems: ['prob-2', 'prob-3'],
        problemCount: 3,
      };
      const result = await generateNewProblems(input);
      setGeneratedProblems(result);
      setIsOpen(true);
      toast({
        title: '문제 생성 완료',
        description: `${result.problems.length}개의 새로운 문제가 생성되었습니다.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: '문제 생성 실패',
        description: 'AI 문제 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        AI로 문제 생성
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI가 생성한 문제</DialogTitle>
            <DialogDescription>
              아래 문제를 검토하고 퀴즈에 추가하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <Accordion type="single" collapsible className="w-full">
              {generatedProblems?.problems.map((problem, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                      <p className="truncate text-left">{problem.question}</p>
                      <Badge variant="outline">{problem.difficulty}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p className="font-semibold">옵션:</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {problem.options.map((option, i) => (
                          <li key={i}>{option}</li>
                        ))}
                      </ul>
                      <p className="font-semibold pt-2">정답:</p>
                      <p>{problem.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              닫기
            </Button>
            <Button onClick={() => {
                toast({ title: "성공!", description: "선택된 문제가 퀴즈에 추가되었습니다." });
                setIsOpen(false);
            }}>
              퀴즈에 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
