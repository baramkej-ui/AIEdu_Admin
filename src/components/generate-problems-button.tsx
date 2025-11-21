'use client';

import * as React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  generateNewProblems,
  GenerateNewProblemsOutput,
} from '@/ai/flows/generate-new-problems';

export function GenerateProblemsButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [generatedProblems, setGeneratedProblems] =
    React.useState<GenerateNewProblemsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedProblems(null);
    try {
      // Mock input for the AI flow
      const input = {
        studentId: 'student-1',
        solvedProblems: ['prob-1'],
        recentProblems: ['prob-2', 'prob-3'],
        problemCount: 3,
      };
      const result = await generateNewProblems(input);
      setGeneratedProblems(result);
      setIsOpen(true);
      toast({
        title: 'Problem Generation Complete',
        description: `${result.problems.length} new problems have been generated.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Problem Generation Failed',
        description: 'An error occurred during AI problem generation.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Generate with AI
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Problems</DialogTitle>
            <DialogDescription>
              Review the problems below and add them to the quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <Accordion type="single" collapsible className="w-full">
              {generatedProblems?.problems.map((problem, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                      <p className="truncate text-left">{problem.question}</p>
                      <Badge variant="outline">{problem.difficulty}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p className="font-semibold">Options:</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {problem.options.map((option, i) => (
                          <li key={i}>{option}</li>
                        ))}
                      </ul>
                      <p className="font-semibold pt-2">Answer:</p>
                      <p>{problem.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
                toast({ title: "Success!", description: "Selected problems have been added to the quiz." });
                setIsOpen(false);
            }}>
              Add to Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
