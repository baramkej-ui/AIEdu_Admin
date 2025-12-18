export type UserRole = 'admin' | 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  lastLoginAt?: Date;
};

export type Problem = {
  id: string;
  number: number;
  question: string;
  question2?: string;
  type: 'multiple-choice' | 'subjective';
  subType?: 'short-answer' | 'descriptive';
  options?: string[];
  answer?: string;
  grading?: 'ai' | 'teacher';
  gradingCriteria?: string;
};

export type StudentProgress = {
  id: string;
  studentId: string;
  problemId: string;
  solved: boolean;
  correct: boolean;
  timeTaken: number; // in seconds
};

export type LevelTest = {
    id: 'reading' | 'writing' | 'speaking' | 'listening';
    totalTimeMinutes: number;
    problemIds: string[];
};

export type RolePlayScenario = {
  id: string;
  place: string;
  situation: string;
};
