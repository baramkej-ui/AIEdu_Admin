import type { User, Problem, Student, StudentProgress } from './types';

export const users: User[] = [
  { id: 'user-1', name: '앨리스 관리자', email: 'admin@edu.com', role: 'admin', avatarUrl: 'https://picsum.photos/seed/101/40/40' },
  { id: 'user-2', name: '밥 교사', email: 'teacher@edu.com', role: 'teacher', avatarUrl: 'https://picsum.photos/seed/102/40/40' },
  { id: 'user-3', name: '찰리 학생', email: 'student@edu.com', role: 'student', avatarUrl: 'https://picsum.photos/seed/103/40/40' },
  { id: 'user-4', name: '데이브 학생', email: 'student2@edu.com', role: 'student', avatarUrl: 'https://picsum.photos/seed/104/40/40' },
];

export const problems: Problem[] = [
  {
    id: 'prob-1',
    question: 'React에서 컴포넌트의 상태를 관리하기 위해 사용되는 Hook은 무엇인가요?',
    options: ['useEffect', 'useState', 'useContext', 'useReducer'],
    answer: 'useState',
    difficulty: 'easy',
    topic: 'React Hooks',
  },
  {
    id: 'prob-2',
    question: '다음 중 CSS 박스 모델의 구성 요소가 아닌 것은 무엇인가요?',
    options: ['Margin', 'Padding', 'Border', 'Flexbox'],
    answer: 'Flexbox',
    difficulty: 'easy',
    topic: 'CSS',
  },
  {
    id: 'prob-3',
    question: "JavaScript에서 `==`와 `===`의 차이점은 무엇인가요?",
    options: ['차이 없음', '`===`는 타입 변환을 수행함', '`==`는 타입 변환을 수행함', '`==`는 더 빠름'],
    answer: '`==`는 타입 변환을 수행함',
    difficulty: 'medium',
    topic: 'JavaScript',
  },
  {
    id: 'prob-4',
    question: "Next.js에서 정적 생성을 위해 사용되는 함수 이름은 무엇인가요?",
    options: ['getServerSideProps', 'getInitialProps', 'getStaticPaths', 'getStaticProps'],
    answer: 'getStaticProps',
    difficulty: 'hard',
    topic: 'Next.js',
  },
];

export const studentProgressData: StudentProgress[] = [
    { studentId: 'user-3', problemId: 'prob-1', solved: true, correct: true, timeTaken: 30 },
    { studentId: 'user-3', problemId: 'prob-2', solved: true, correct: false, timeTaken: 45 },
    { studentId: 'user-4', problemId: 'prob-1', solved: true, correct: true, timeTaken: 25 },
];


export const students: Student[] = users
  .filter((user): user is User & { role: 'student' } => user.role === 'student')
  .map(studentUser => ({
    ...studentUser,
    progress: studentProgressData.filter(p => p.studentId === studentUser.id),
  }));
