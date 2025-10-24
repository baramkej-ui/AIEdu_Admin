'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import type { RolePlayScenario } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const formSchema = z.object({
    place: z.string().min(1, '장소를 입력해주세요.'),
    situation: z.string().min(1, '상황을 입력해주세요.'),
});

type FormData = z.infer<typeof formSchema>;

interface RolePlayFormProps {
  scenario?: RolePlayScenario;
  onSave: (data: Omit<RolePlayScenario, 'id'>, id?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function RolePlayForm({ scenario, onSave, isOpen, setIsOpen }: RolePlayFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEditing = !!scenario;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  
  React.useEffect(() => {
    if (isOpen) {
        if (scenario) { // Editing
            form.reset(scenario);
        } else { // Creating
            form.reset({
                place: '',
                situation: '',
            });
        }
    }
  }, [isOpen, scenario, form]);


  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      await onSave(values, scenario?.id);
      setIsOpen(false);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "저장 실패",
            description: error.message || "상황을 저장하는 중 오류가 발생했습니다."
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '상황 수정' : '새로운 상황 추가'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '상황의 세부 정보를 수정합니다.' : '새로운 Role-Play 상황의 정보를 입력해주세요.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장소</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 레스토랑, 공항" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="situation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상황</FormLabel>
                  <FormControl>
                    <Textarea placeholder="예: 음식에 머리카락이 나왔을 때 점원에게 항의하는 상황" {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">취소</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
