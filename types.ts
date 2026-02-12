export type QuestionDifficulty = 'Fácil' | 'Médio' | 'Difícil' | 'Complexo';

export type DbCategory = 
  | 'constitucional' | 'Constitucional'
  | 'administrativo' | 'Administrativo'
  | 'licitacao_contratos' 
  | 'servidores_publicos' 
  | 'penal' | 'Penal';

export interface Question {
  id: string; // UUID from Supabase
  topic: string; // Display name
  dbCategory: DbCategory; // Enum value for DB
  subtopic?: string; 
  enunciado: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: QuestionDifficulty;
  userSelectedAnswer?: number;
  isMarkedForReview?: boolean;
  aiHint?: string; // explicacao_ia from DB
  area?: string; // New field for Area
  banca?: string; // Exam Board (e.g., Cebraspe)
  orgao?: string; // Organization (e.g., PF, TCU)
}

export interface TopicStat {
  answered: number;
  correct: number;
}

export interface UserProfile {
  id: string; // Auth ID
  email?: string;
  name: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: 'free' | 'monthly' | 'biannual' | 'annual';
  xp: number; // mapped from 'pontos'
  level: number;
  questionsAnswered: number; // mapped from total_acertos + total_erros
  correctAnswers: number; // mapped from total_acertos
  streak: number; 
  bookmarkedQuestions: Question[];
  history: { date: string; score: number }[];
  topicStats: Record<string, TopicStat>;
  // New field to hold raw DB counters for update logic
  rawProfileStats: {
    acertos_constitucional: number;
    acertos_administrativo: number;
    acertos_licitacoes: number;
    acertos_servidores: number;
    acertos_penal: number;
    erro_constitucional: number;
    erro_administrativo: number;
    erro_licitacao_contrato: number;
    erro_servidores: number;
    erro_penal: number;
  };
}

export interface LevelDefinition {
  name: string;
  minXP: number;
  icon: string;
  color: string;
}

export enum GameState {
  AUTH,
  DASHBOARD,
  SETUP_QUIZ,
  EXAM_SETUP, // New screen for advanced exam setup
  PLAYING,
  SUMMARY,
  REVIEW_LIST,
  CANDIDATE_AREA
}

export interface QuizConfig {
  topics: string[]; // Empty array means "Aleatório" (All)
  areas: string[];  // Empty array means "Aleatório" (All)
  bancas?: string[]; // Optional filter for Exam Boards
  orgaos?: string[]; // Optional filter for Organizations
  count: number;
  isExamMode?: boolean; // Forces use of 'questao_prova' table
}