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
    place: z.string().min(1, 'Place is required.'),
    situation: z.string().min(1, 'Situation is required.'),
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
            title: "Save Failed",
            description: error.message || "An error occurred while saving the scenario."
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Scenario' : 'Add New Scenario'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify the details of the scenario.' : 'Enter the information for the new Role-Play scenario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Restaurant, Airport" {...field} />
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
                  <FormLabel>Situation</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., A situation where you complain to the staff because you found a hair in your food." {...field} rows={5} />
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
