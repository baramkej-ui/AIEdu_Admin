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
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole, User } from '@/lib/types';

const formSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요.').email({ message: '유효한 이메일을 입력해주세요.' }),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});


interface AuthFormProps {
  type: 'login';
}

const roleRedirects: Record<UserRole, string> = {
    admin: '/dashboard',
    teacher: '/students',
    student: '/problems',
};

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "오류",
            description: "Firebase가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요."
        });
        setIsLoading(false);
        return;
    }
    
    const { email, password } = values;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          toast({ title: "로그인 성공", description: "대시보드로 이동합니다." });
          router.push(roleRedirects[userData.role]);
      } else {
          throw new Error("사용자 역할 정보를 찾을 수 없습니다.");
      }
    } catch (error: any) {
        const errorCode = error.code;
        let errorMessage = "오류가 발생했습니다.";
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          errorMessage = '이메일 또는 비밀번호가 잘못되었습니다.';
        }
        toast({
          variant: 'destructive',
          title: '인증 실패',
          description: errorMessage,
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          로그인
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <span className="text-muted-foreground/50">(관리자에게 문의)</span>
      </p>
    </Form>
  );
}
