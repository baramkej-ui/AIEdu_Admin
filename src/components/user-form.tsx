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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const baseSchema = z.object({
    name: z.string().min(1, '이름을 입력해주세요.'),
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    role: z.enum(['admin', 'teacher', 'student']),
    id: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

const createUserSchema = baseSchema.extend({
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
});

const updateUserSchema = baseSchema.extend({
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
    if (data.password || data.confirmPassword) {
        if (!data.password || data.password.length < 6) return false;
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "비밀번호가 일치하지 않거나 6자 미만입니다.",
    path: ["confirmPassword"],
});


interface UserFormProps {
  user?: User;
  onSave: (data: any, id?: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  defaultRole: UserRole;
}

export function UserForm({ user, onSave, isOpen, setIsOpen, defaultRole }: UserFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEditing = !!user;

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
  });
  
  React.useEffect(() => {
    if (isOpen) {
        if (user) { // Editing
            form.reset({
              ...user,
              password: '',
              confirmPassword: ''
            });
        } else { // Creating
            form.reset({
                name: '',
                email: '',
                role: defaultRole,
                password: '',
                confirmPassword: '',
            });
        }
    }
  }, [isOpen, user, defaultRole, form]);


  async function onSubmit(values: z.infer<typeof createUserSchema>) {
    setIsLoading(true);
    try {
      // For updates, don't send empty password fields
      const dataToSave = { ...values };
      if (isEditing && !dataToSave.password) {
        delete dataToSave.password;
        delete dataToSave.confirmPassword;
      }
      await onSave(dataToSave, user?.id);
      setIsOpen(false);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "저장 실패",
            description: error.message || "사용자를 저장하는 중 오류가 발생했습니다."
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '사용자 정보 수정' : '새 사용자 추가'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '사용자의 정보를 수정합니다.' : '새로운 사용자의 정보를 입력해주세요.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isEditing ? (
              <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>역할</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="역할 선택..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">관리자</SelectItem>
                          <SelectItem value="teacher">교사</SelectItem>
                          <SelectItem value="student">학생</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            ) : null }
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "새 비밀번호 (선택)" : "비밀번호"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "새 비밀번호 확인" : "비밀번호 확인"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
