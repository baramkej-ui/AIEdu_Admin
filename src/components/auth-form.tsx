'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole, User } from '@/lib/types';

const formSchema = z.object({
  email: z.string().min(1, 'Please enter your email.').email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, 'Please enter your password.'),
});


interface AuthFormProps {
  type: 'login';
}

const roleRedirects: Record<UserRole, string> = {
    admin: '/dashboard',
    teacher: '/login', // Teachers are blocked
    student: '/login', // Students are blocked
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
            title: "Error",
            description: "Firebase is not initialized. Please try again later."
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
          const userRole = userData.role ? userData.role.trim() : undefined;
          
          if (userRole === 'admin') {
            router.push(roleRedirects.admin);
          } else {
            await auth.signOut();
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Only admin accounts can log in.',
            });
          }
      } else {
          await auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: "User data not found in the database. Contact support.",
          });
      }
    } catch (error: any) {
        const errorCode = error.code;
        let errorMessage = "An error occurred during login.";
        
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
          errorMessage = 'Incorrect email or password.';
        } else {
            console.error("Login Error:", error);
            errorMessage = "An unexpected error occurred. Please try again.";
        }
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
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
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log In
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <span className="text-muted-foreground/50">(Contact an administrator)</span>
      </p>
    </Form>
  );
}
