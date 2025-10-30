'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

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
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';

const problemSchema = z
  .object({
    number: z.coerce.number({ required_error: '문제 번호를 입력해주세요.' }).min(1, '문제 번호는 1 이상이어야 합니다.'),
    question: z.string().min(1, '질문은 최소 1자 이상이어야 합니다.'),
    question2: z.string().optional(),
    type: z.enum(['multiple-choice', 'subjective']).default('multiple-choice'),
    subType: z.enum(['short-answer', 'descriptive']).default('short-answer'),
    options: z
      .array(
        z.object({
          value: z.string().min(1, '보기 내용을 입력해주세요.'),
        })
      )
      .optional(),
    answer: z.string().optional(),
    grading: z.enum(['ai', 'teacher']).optional(),
    gradingCriteria: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'multiple-choice') {
        return (
          data.options && data.options.length >= 2 && data.answer !== undefined && data.answer !== ''
        );
      }
      return true;
    },
    {
      message: '객관식 문제는 최소 2개 이상의 보기와 정답이 필요합니다.',
      path: ['answer'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'subjective' && data.subType === 'short-answer') {
        return data.answer && data.answer.length > 0;
      }
      return true;
    },
    {
      message: '단답형 문제는 정답을 반드시 입력해야 합니다.',
      path: ['answer'],
    }
  );

type ProblemFormData = z.infer<typeof problemSchema>;

interface ProblemFormProps {
  problem?: Problem;
  onSave: (data: Omit<Problem, 'id'>, id?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ProblemForm({ problem, onSave, isOpen, setIsOpen }: ProblemFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProblemFormData>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      number: 1,
      question: '',
      question2: '',
      type: 'multiple-choice',
      subType: 'short-answer',
      options: [],
      answer: '',
      grading: 'ai',
      gradingCriteria: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const problemType = form.watch('type');
  const subjectiveType = form.watch('subType');
  const gradingMethod = form.watch('grading');
  
  const handleOptionCountChange = (count: number) => {
    const currentCount = fields.length;
    if (count > currentCount) {
      for (let i = 0; i < count - currentCount; i++) {
        append({ value: '' });
      }
    } else if (count < currentCount) {
      for (let i = currentCount - 1; i >= count; i--) {
        remove(i);
      }
    }
  };

  const optionCount = form.watch('options')?.length || 0;
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        number: 1,
        question: '',
        question2: '',
        type: 'multiple-choice',
        subType: 'short-answer',
        options: Array.from({ length: 4 }, () => ({ value: '' })),
        answer: '',
        grading: 'ai',
        gradingCriteria: '',
      });
      
      if (problem) {
        const optionsAsObjects = problem.options?.map(opt => ({ value: opt })) || [];
        let answerValue: string | undefined = problem.answer;

        if (problem.type === 'multiple-choice') {
            const answerIndex = problem.options?.indexOf(problem.answer || '') ?? -1;
            answerValue = answerIndex > -1 ? String(answerIndex) : undefined;
        }

        form.reset({
          ...problem,
          options: optionsAsObjects,
          answer: answerValue
        });

      } else {
         // This makes sure that on creating a new problem, it defaults to 4 options
         form.setValue('options', Array.from({ length: 4 }, () => ({ value: '' })))
      }
    }
  }, [isOpen, problem, form]);


  async function onSubmit(values: ProblemFormData) {
    setIsLoading(true);
    try {
      const saveData: Omit<Problem, 'id'> = {
        ...values,
        options: values.options?.map(opt => opt.value),
        answer: values.type === 'multiple-choice' && values.answer && values.options
            ? values.options[parseInt(values.answer, 10)]?.value
            : values.answer,
      };
      
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{problem ? '문제 수정' : '새 문제 생성'}</DialogTitle>
          <DialogDescription>
            퀴즈에 사용될 문제를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>문제 번호</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>문제 1 (필수)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="학생에게 제시될 주된 질문을 입력하세요." {...field} rows={3}/>
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
                  <FormLabel>문제 2 (선택)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="필요한 경우, 추가 안내문이나 보조 질문을 입력하세요." {...field} rows={3} />
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
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('answer', '');
                        if (value === 'multiple-choice') {
                          handleOptionCountChange(4);
                        } else {
                          // Clear options when switching to subjective
                          handleOptionCountChange(0);
                        }
                      }}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="multiple-choice" />
                        </FormControl>
                        <FormLabel className="font-normal">객관식</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="subjective" />
                        </FormControl>
                        <FormLabel className="font-normal">주관식</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {problemType === 'multiple-choice' && (
              <Card className="p-4 bg-muted/30">
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-2">
                    <Label>보기 개수</Label>
                    <Select
                      value={String(optionCount)}
                      onValueChange={(val) => handleOptionCountChange(Number(val))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8].map(num => (
                          <SelectItem key={num} value={String(num)}>{num}개</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>보기 및 정답 설정</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="space-y-2"
                          >
                            {fields.map((item, index) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name={`options.${index}.value`}
                                render={({ field: optionField }) => (
                                  <FormItem className="flex items-center space-x-3">
                                    <FormControl>
                                      <Input
                                        placeholder={`보기 ${index + 1}`}
                                        {...optionField}
                                        className="flex-grow"
                                      />
                                    </FormControl>
                                    <RadioGroupItem value={String(index)} id={`r${index}`} />
                                    <Label htmlFor={`r${index}`} className="font-normal cursor-pointer">정답</Label>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </RadioGroup>
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {problemType === 'subjective' && (
              <Card className="p-4 bg-muted/30">
                <CardContent className="p-0 space-y-4">
                  <FormField
                    control={form.control}
                    name="subType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>주관식 유형</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="short-answer" />
                              <FormLabel className="font-normal">단답형</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="descriptive" />
                              <FormLabel className="font-normal">서술형</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {subjectiveType !== 'descriptive' && (
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            정답
                            {subjectiveType === 'short-answer' && <span className="text-destructive"> (필수)</span>}
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="주관식 정답을 입력하세요." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {subjectiveType === 'descriptive' && (
                    <>
                      <FormField
                        control={form.control}
                        name="grading"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>채점 방식</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value || 'ai'}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <RadioGroupItem value="ai" />
                                  <FormLabel className="font-normal">AI 자동 채점</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <RadioGroupItem value="teacher" />
                                  <FormLabel className="font-normal">교사 직접 채점</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {gradingMethod === 'ai' && (
                        <FormField
                          control={form.control}
                          name="gradingCriteria"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI 채점 기준</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="AI가 답변을 채점할 때 사용할 구체적인 기준을 입력하세요. (예: 키워드, 문장 구조, 논리 전개 등)"
                                  {...field}
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
        <DialogFooter className="pt-6 border-t mt-6">
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
