'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: '유효한 이메일을 입력해주세요.' }),
  role: z.enum(['admin', 'teacher', 'student'], {
    required_error: '역할을 선택해주세요.',
  }),
});

interface AuthFormProps {
  type: 'login' | 'signup';
}

const roleRedirects: Record<UserRole, string> = {
    admin: '/dashboard',
    teacher: '/students',
    student: '/problems',
};

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const currentFormSchema =
    type === 'signup'
      ? formSchema.extend({
          name: z.string().min(2, { message: '이름은 2자 이상이어야 합니다.' }),
        })
      : formSchema;

  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
    setIsLoading(true);
    try {
      if (type === 'login') {
        await login(values.email, values.role);
        toast({ title: "로그인 성공", description: "대시보드로 이동합니다." });
        router.push(roleRedirects[values.role]);
      } else {
        await signup(values.name!, values.email, values.role);
        toast({ title: "가입 성공", description: "환영합니다! 대시보드로 이동합니다." });
        router.push(roleRedirects[values.role]);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {type === 'signup' && (
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
        )}
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
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {type === 'login' ? '로그인' : '가입하기'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {type === 'login' ? (
          <>
            계정이 없으신가요?{' '}
            <Link href="/signup" className="underline hover:text-primary">
              가입하기
            </Link>
          </>
        ) : (
          <>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="underline hover:text-primary">
              로그인
            </Link>
          </>
        )}
      </p>
    </Form>
  );
}
