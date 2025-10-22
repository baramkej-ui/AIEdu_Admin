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
import { problems as allProblems } from "@/lib/data";
import { CheckCircle, XCircle, ArrowRight, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Problem } from '@/lib/types';

export function ProblemSolver() {
  const [problems, setProblems] = React.useState<Problem[]>(() => [...allProblems].sort(() => 0.5 - Math.random()).slice(0, 5));
  const [currentProblemIndex, setCurrentProblemIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);

  const { toast } = useToast();

  const currentProblem = problems[currentProblemIndex];

  const handleNext = () => {
    if (!isAnswered) {
      if (selectedAnswer === null) {
        toast({
          variant: 'destructive',
          title: '답을 선택해주세요.',
        });
        return;
      }
      setIsAnswered(true);
      if (selectedAnswer === currentProblem.answer) {
        setScore(prev => prev + 1);
      }
    } else {
      setIsAnswered(false);
      setSelectedAnswer(null);
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleRestart = () => {
    setProblems([...allProblems].sort(() => 0.5 - Math.random()).slice(0, 5));
    setCurrentProblemIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
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
