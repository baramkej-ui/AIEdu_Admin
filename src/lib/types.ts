export type UserRole = 'admin' | 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

export type Problem = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
};

export type StudentProgress = {
  id: string;
  studentId: string;
  problemId: string;
  solved: boolean;
  correct: boolean;
  timeTaken: number; // in seconds
};

export type Student = User & {
  role: 'student';
  progress: StudentProgress[];
};
