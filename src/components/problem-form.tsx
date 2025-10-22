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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const problemSchema = z.object({
  question: z.string().min(10, '질문은 10자 이상이어야 합니다.'),
  question2: z.string().optional(),
  type: z.enum(['multiple-choice', 'subjective']).default('multiple-choice'),
  // Fields to be added back later based on type
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic: z.string().optional(),
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

  // A simplified schema for now
  const form = useForm({
    // resolver: zodResolver(problemSchema),
    defaultValues: problem
      ? { ...problem }
      : {
          question: '',
          question2: '',
          type: 'multiple-choice',
        },
  });


  React.useEffect(() => {
    form.reset(problem || {
      question: '',
      question2: '',
      type: 'multiple-choice',
    });
  }, [problem, form, isOpen]);

  async function onSubmit(values: any) { // z.infer<typeof problemSchema>
    setIsLoading(true);
    try {
      // This will be expanded later
      const saveData = {
        ...values,
        number: problem?.number || Date.now(),
        difficulty: values.difficulty || 'easy',
        topic: values.topic || '일반',
      }
      await onSave(saveData, problem?.id);
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
                    <Textarea placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="question2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>문제2(설명) (option)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>문제 유형</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="multiple-choice" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          객관식
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="subjective" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          주관식
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
