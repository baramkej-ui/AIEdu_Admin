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
    number: z.coerce.number({ required_error: 'Problem number is required.' }).min(1, 'Problem number must be at least 1.'),
    question: z.string().min(1, 'Question must be at least 1 character long.'),
    question2: z.string().optional(),
    type: z.enum(['multiple-choice', 'subjective']).default('multiple-choice'),
    subType: z.enum(['short-answer', 'descriptive']).default('short-answer'),
    options: z
      .array(
        z.object({
          value: z.string().min(1, 'Option content is required.'),
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
      message: 'Multiple choice questions require at least 2 options and a selected answer.',
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
      message: 'Short answer questions require an answer to be provided.',
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
      const resetToNew = () => {
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
      };
      
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
         resetToNew();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, problem]);


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
        title: 'Save Failed',
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
          <DialogTitle>{problem ? 'Edit Problem' : 'Create New Problem'}</DialogTitle>
          <DialogDescription>
            Enter the details for the quiz problem.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Number</FormLabel>
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
                  <FormLabel>Question 1 (Required)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the main question to be presented to the student." {...field} rows={3}/>
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
                  <FormLabel>Question 2 (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional instructions or supplementary questions if needed." {...field} rows={3} />
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
                  <FormLabel>Problem Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        const currentValues = form.getValues();
                        field.onChange(value)
                        form.setValue('answer', '');
                        if (value === 'multiple-choice') {
                          handleOptionCountChange(currentValues.options?.length || 4);
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
                        <FormLabel className="font-normal">Multiple Choice</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="subjective" />
                        </FormControl>
                        <FormLabel className="font-normal">Subjective</FormLabel>
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
                    <Label>Number of Options</Label>
                    <Select
                      value={String(optionCount)}
                      onValueChange={(val) => handleOptionCountChange(Number(val))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8].map(num => (
                          <SelectItem key={num} value={String(num)}>{num} options</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Options & Correct Answer</FormLabel>
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
                                        placeholder={`Option ${index + 1}`}
                                        {...optionField}
                                        className="flex-grow"
                                      />
                                    </FormControl>
                                    <RadioGroupItem value={String(index)} id={`r${index}`} />
                                    <Label htmlFor={`r${index}`} className="font-normal cursor-pointer">Answer</Label>
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
                        <FormLabel>Subjective Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="short-answer" />
                              <FormLabel className="font-normal">Short Answer</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="descriptive" />
                              <FormLabel className="font-normal">Descriptive</FormLabel>
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
                            Answer
                            {subjectiveType === 'short-answer' && <span className="text-destructive"> (Required)</span>}
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter the subjective answer." {...field} />
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
                            <FormLabel>Grading Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value || 'ai'}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <RadioGroupItem value="ai" />
                                  <FormLabel className="font-normal">AI Auto Grading</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <RadioGroupItem value="teacher" />
                                  <FormLabel className="font-normal">Manual Grading by Teacher</FormLabel>
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
                              <FormLabel>AI Grading Criteria</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the specific criteria the AI should use to grade the answer (e.g., keywords, sentence structure, logical flow)."
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
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
