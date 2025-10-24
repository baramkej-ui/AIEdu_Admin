'use server';

/**
 * @fileOverview Securely creates a Firebase Authentication user.
 *
 * - createFirebaseAuthUser - A function to create a user in Firebase Auth.
 * - CreateUserInput - Input schema for the user creation flow.
 * - CreateUserOutput - Output schema for the user creation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string().optional(),
  error: z.string().optional(),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({
        // Service account credentials will be automatically picked up
        // from the environment in a secure server environment.
    });
} else {
    adminApp = getApps()[0];
}


export async function createFirebaseAuthUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createFirebaseAuthUserFlow(input);
}

const createFirebaseAuthUserFlow = ai.defineFlow(
  {
    name: 'createFirebaseAuthUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async ({ email, password }) => {
    try {
      const auth = getAuth(adminApp);
      const userRecord = await auth.createUser({
        email,
        password,
      });
      return { uid: userRecord.uid };
    } catch (error: any) {
      console.error("Firebase Auth user creation failed:", error);
      return { error: error.message || 'An unknown error occurred.' };
    }
  }
);
