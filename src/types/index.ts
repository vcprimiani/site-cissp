export interface User {
  id: string;
  name: string;
  email: string;
  role: 'leader';
  createdAt: Date;
  points: number;
  sessionsLed: number;
  questionsContributed: number;
  achievements: Achievement[];
  avatar_url?: string;
  studyProgress?: StudyProgress;
  questionLists?: QuestionList[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: Date;
}

export interface StudyProgress {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  streakCount: number;
  longestStreak: number;
  domainProgress: Record<string, {
    questionsAnswered: number;
    correctAnswers: number;
    lastStudied: Date;
  }>;
  difficultyProgress: Record<string, {
    questionsAnswered: number;
    correctAnswers: number;
  }>;
  weeklyGoal: number;
  weeklyProgress: number;
  lastStudySession: Date;
  studyDays: number;
}

export interface QuestionList {
  id: string;
  name: string;
  description?: string;
  questionIds: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  color?: string;
}

export interface StudySession {
  id: string;
  date: Date;
  timeSlot: string;
  leader: string;
  leaderId: string;
  topic: string;
  participants: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  selectedQuestions: string[];
  eventId?: string;
  eventType?: 'study-group' | 'community' | 'ccsp';
}

export interface Message {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  replies: Message[];
  likes: number;
  likedBy: string[];
  isPinned?: boolean;
}

export interface Question {
  id: string;
  domain: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  aiExplanation?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Quiz {
  id: string;
  questions: Question[];
  currentQuestion: number;
  userAnswers: (number | null)[];
  score: number;
  startTime: Date;
  endTime?: Date;
  timeLimit: number;
}

export type AppMode = 'question-bank' | 'quiz';

export interface AppState {
  mode: AppMode;
  currentUser: User | null;
  users: User[];
  sessions: StudySession[];
  messages: Message[];
  questions: Question[];
  currentQuiz: Quiz | null;
  isAuthenticated: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}