'use client';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ArrowRight, RotateCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Problem, StudentProgress } from '@/lib/types';
import { useFirestore, useCollection, useUser, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export function ProblemSolver() {
  const firestore = useFirestore();
  const { user } = useUser();
  const problemsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'problems') : null, [firestore]);
  const { data: allProblems, isLoading } = useCollection<Problem>(problemsCollectionRef);

  const [problems, setProblems] = React.useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);

  const { toast } = useToast();

  React.useEffect(() => {
    if (allProblems) {
      const shuffled = [...allProblems].sort(() => 0.5 - Math.random()).slice(0, 5);
      setProblems(shuffled);
      setCurrentProblemIndex(0);
      setStartTime(Date.now());
    }
  }, [allProblems]);

  if (isLoading || problems.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  const handleNext = async () => {
    if (!isAnswered) {
      if (selectedAnswer === null) {
        toast({
          variant: 'destructive',
          title: '답을 선택해주세요.',
        });
        return;
      }
      setIsAnswered(true);
      const isCorrect = selectedAnswer === currentProblem.answer;
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      if (user && firestore) {
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        const progressId = `${user.uid}-${currentProblem.id}`;
        const progressRef = doc(firestore, 'studentProgress', progressId);
        const progressData: Omit<StudentProgress, 'id'> = {
          studentId: user.uid,
          problemId: currentProblem.id,
          solved: true,
          correct: isCorrect,
          timeTaken: timeTaken,
        };
        setDocumentNonBlocking(progressRef, progressData, { merge: true });
      }

    } else {
      setIsAnswered(false);
      setSelectedAnswer(null);
      setStartTime(Date.now());
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleRestart = () => {
    if (allProblems) {
      const shuffled = [...allProblems].sort(() => 0.5 - Math.random()).slice(0, 5);
      setProblems(shuffled);
    }
    setCurrentProblemIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setStartTime(Date.now());
  }

  if (isFinished) {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">퀴즈 완료!</CardTitle>
                <CardDescription>수고하셨습니다. 결과를 확인해보세요.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-4xl font-bold">
                    {score} / {problems.length}
                </p>
                <p className="text-lg text-muted-foreground">
                    정확도: {((score / problems.length) * 100).toFixed(0)}%
                </p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleRestart}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    다시 풀기
                </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress value={((currentProblemIndex + 1) / problems.length) * 100} className="mb-4" />
      <Card>
        <CardHeader>
          <CardTitle>문제 {currentProblemIndex + 1}</CardTitle>
          <CardDescription className="pt-2 text-lg text-foreground font-semibold">
            {currentProblem.question}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswer ?? ''}
            onValueChange={setSelectedAnswer}
            disabled={isAnswered}
          >
            {currentProblem.options.map((option, index) => {
              const isCorrect = option === currentProblem.answer;
              const isSelected = option === selectedAnswer;
              
              return (
                <Label
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 rounded-md border p-4 transition-colors",
                    isAnswered && isCorrect && "border-green-500 bg-green-500/10",
                    isAnswered && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                    !isAnswered && "cursor-pointer hover:bg-accent"
                  )}
                >
                  <RadioGroupItem value={option} />
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
                </Label>
              )
            })}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex-col items-stretch">
          {isAnswered && (
            <div className={cn(
                "mb-4 rounded-md p-3 text-sm",
                selectedAnswer === currentProblem.answer ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"
            )}>
                {selectedAnswer === currentProblem.answer ? "정답입니다!" : `오답입니다. 정답은 "${currentProblem.answer}" 입니다.`}
            </div>
          )}
          <Button onClick={handleNext} className="w-full">
            {isAnswered ? '다음 문제' : '정답 확인'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
