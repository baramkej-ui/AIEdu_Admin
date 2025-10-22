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
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole, User } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().min(1, '이메일을 입력해주세요.').email({ message: '유효한 이메일을 입력해주세요.' }),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
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
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const currentFormSchema =
    type === 'signup'
      ? formSchema.extend({ name: z.string().min(1, '이름을 입력해주세요.'), password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.')})
      : formSchema.omit({ name: true, role: true });

  const form = useForm<z.infer<typeof currentFormSchema>>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(type === 'signup' ? { name: '', role: 'student' } : {}),
    },
  });

  async function onSubmit(values: z.infer<typeof currentFormSchema>) {
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
    try {
      if (type === 'login') {
        const { email, password } = values;
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
      } else if (type === 'signup') {
        const { name, email, password, role } = values as z.infer<typeof formSchema>;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDocRef = doc(firestore, "users", user.uid);
        const userData = {
            id: user.uid,
            name: name,
            email: email,
            role: role,
            avatarUrl: `https://picsum.photos/seed/${user.uid}/40/40`
        };
        await setDocumentNonBlocking(userDocRef, userData, { merge: true });
        
        toast({ title: "가입 성공", description: "환영합니다! 대시보드로 이동합니다." });
        router.push(roleRedirects[role]);
      }
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      let errorMessage = "오류가 발생했습니다.";
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        errorMessage = '이메일 또는 비밀번호가 잘못되었습니다.';
      } else if (errorCode === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = '비밀번호는 6자 이상이어야 합니다.';
      } else {
        errorMessage = error.message || errorMessage;
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
        {type === 'signup' && (
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
        )}
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
