'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Problem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const problemSchema = z.object({
  question: z.string().min(10, '질문은 10자 이상이어야 합니다.'),
  options: z.array(z.string().min(1, '옵션은 비워둘 수 없습니다.')).min(2, '최소 2개의 옵션이 필요합니다.'),
  answer: z.string().min(1, '정답을 선택해주세요.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string().min(2, '주제는 2자 이상이어야 합니다.'),
});

interface ProblemFormProps {
  problem?: Problem;
  onSave: (data: Omit<Problem, 'id'>, id?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ProblemForm({ problem, onSave, isOpen, setIsOpen }: ProblemFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: problem
      ? { ...problem }
      : {
          question: '',
          options: ['', ''],
          answer: '',
          difficulty: 'easy',
          topic: '',
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  React.useEffect(() => {
    form.reset(problem || {
      question: '',
      options: ['', ''],
      answer: '',
      difficulty: 'easy',
      topic: '',
    });
  }, [problem, form, isOpen]);

  async function onSubmit(values: z.infer<typeof problemSchema>) {
    setIsLoading(true);
    try {
      await onSave(values, problem?.id);
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{problem ? '문제 수정' : '새 문제 생성'}</DialogTitle>
          <DialogDescription>
            퀴즈에 사용될 문제를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>질문</FormLabel>
                  <FormControl>
                    <Textarea placeholder="예: React의 가상 DOM이란 무엇인가요?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>주제</FormLabel>
                  <FormControl>
                    <Input placeholder="예: React Hooks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>옵션</FormLabel>
              <div className="space-y-2 pt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} placeholder={`옵션 ${index + 1}`} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append('')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                옵션 추가
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>정답</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="정답 선택..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch('options').map((option, index) => (
                          option && <SelectItem key={index} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>난이도</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="난이도 선택..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">쉬움</SelectItem>
                        <SelectItem value="medium">중간</SelectItem>
                        <SelectItem value="hard">어려움</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
