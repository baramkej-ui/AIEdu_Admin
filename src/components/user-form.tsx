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
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Please enter a valid email.'),
    role: z.enum(['admin', 'teacher', 'student']),
    id: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

const createUserSchema = baseSchema.extend({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
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
    message: "Passwords do not match or are less than 6 characters.",
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
            title: "Save Failed",
            description: error.message || "An error occurred while saving the user."
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User Information' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify the user\'s details.' : 'Enter the information for the new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
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
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
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
                    <FormLabel>{isEditing ? "New Password (Optional)" : "Password"}</FormLabel>
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
                    <FormLabel>{isEditing ? "Confirm New Password" : "Confirm Password"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
