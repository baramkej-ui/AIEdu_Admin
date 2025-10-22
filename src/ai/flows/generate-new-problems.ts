'use server';

/**
 * @fileOverview Generates new problem sets tailored to a student's level based on their past performance.
 *
 * - generateNewProblems - A function that generates new problem sets.
 * - GenerateNewProblemsInput - The input type for the generateNewProblems function.
 * - GenerateNewProblemsOutput - The return type for the generateNewProblems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewProblemsInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  solvedProblems: z.array(z.string()).describe('The IDs of the problems the student has solved.'),
  recentProblems: z.array(z.string()).describe('The IDs of the problems the student has recently attempted.'),
  problemCount: z.number().describe('The number of problems to generate.'),
});
export type GenerateNewProblemsInput = z.infer<typeof GenerateNewProblemsInputSchema>;

const GenerateNewProblemsOutputSchema = z.object({
  problems: z.array(
    z.object({
      question: z.string().describe('The question text.'),
      options: z.array(z.string()).describe('The possible answer options.'),
      answer: z.string().describe('The correct answer.'),
      difficulty: z.string().describe('The difficulty level of the problem.'),
    })
  ).describe('The generated problem set.'),
});
export type GenerateNewProblemsOutput = z.infer<typeof GenerateNewProblemsOutputSchema>;

export async function generateNewProblems(input: GenerateNewProblemsInput): Promise<GenerateNewProblemsOutput> {
  return generateNewProblemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewProblemsPrompt',
  input: {schema: GenerateNewProblemsInputSchema},
  output: {schema: GenerateNewProblemsOutputSchema},
  prompt: `You are an expert quiz generator for students.

You will generate a new problem set tailored to the student's level based on their past performance.
Consider the student's previously solved problems and recent problems to adjust the problem level appropriately.

Student ID: {{{studentId}}}
Solved Problems: {{#each solvedProblems}}{{{this}}}, {{/each}}
Recent Problems: {{#each recentProblems}}{{{this}}}, {{/each}}
Number of Problems to Generate: {{{problemCount}}}

Output a JSON array of problems, where each problem has a question, options, answer, and difficulty.
`,
});

const generateNewProblemsFlow = ai.defineFlow(
  {
    name: 'generateNewProblemsFlow',
    inputSchema: GenerateNewProblemsInputSchema,
    outputSchema: GenerateNewProblemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
