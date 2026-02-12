import { LevelDefinition, UserProfile, Question, DbCategory } from './types';

export const LEVELS: LevelDefinition[] = [
  { name: 'Aprendiz', minXP: 0, icon: '🎓', color: 'text-slate-400' },
  { name: 'Júnior', minXP: 1000, icon: '⚖️', color: 'text-blue-400' },
  { name: 'Pleno', minXP: 2500, icon: '📜', color: 'text-cyan-400' },
  { name: 'Sênior', minXP: 5000, icon: '🏛️', color: 'text-indigo-400' },
  { name: 'Líder', minXP: 8000, icon: '🏵️', color: 'text-purple-400' },
  { name: 'Mestre', minXP: 12000, icon: '👑', color: 'text-jur-gold-400' },
];

export const INITIAL_USER: UserProfile = {
  id: 'demo-user',
  name: 'Doutor(a)',
  xp: 0,
  level: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  streak: 0,
  bookmarkedQuestions: [],
  history: [
    { date: '2023-10-01', score: 45 },
    { date: '2023-10-05', score: 60 },
    { date: '2023-10-10', score: 75 },
    { date: '2023-10-15', score: 70 },
    { date: '2023-10-20', score: 85 },
  ],
  topicStats: {
    'Direito Administrativo': { answered: 0, correct: 0 },
    'Direito Constitucional': { answered: 0, correct: 0 },
    'Licitações e Contratos': { answered: 0, correct: 0 },
    'Servidores Públicos': { answered: 0, correct: 0 },
    'Direito Penal': { answered: 0, correct: 0 },
  },
  rawProfileStats: {
    acertos_constitucional: 0,
    acertos_administrativo: 0,
    acertos_licitacoes: 0,
    acertos_servidores: 0,
    acertos_penal: 0,
    erro_constitucional: 0,
    erro_administrativo: 0,
    erro_licitacao_contrato: 0,
    erro_servidores: 0,
    erro_penal: 0
  }
};

// Fallback question if API fails or for demo purposes
export const MOCK_QUESTION: Question = {
  id: 'mock-1',
  topic: 'Direito Administrativo',
  dbCategory: 'Administrativo',
  subtopic: 'Poderes da Administração',
  enunciado: 'O poder que a Administração Pública possui de apurar infrações e aplicar penalidades aos servidores públicos e demais pessoas sujeitas à disciplina administrativa é denominado:',
  options: [
    'Poder Hierárquico',
    'Poder Disciplinar',
    'Poder de Polícia',
    'Poder Regulamentar'
  ],
  correctAnswerIndex: 1,
  explanation: 'O Poder Disciplinar é a faculdade de punir internamente as infrações funcionais dos servidores e demais pessoas sujeitas à disciplina dos órgãos e serviços da Administração. Difere do Poder de Polícia, que atinge particulares em geral.',
  difficulty: 'Médio',
  area: 'Administrativa',
  banca: 'FGV',
  orgao: 'TJ-RJ'
};

export const TOPIC_TO_DB: Record<string, DbCategory> = {
  'Direito Constitucional': 'Constitucional',
  'Direito Administrativo': 'Administrativo',
  'Licitações e Contratos': 'licitacao_contratos',
  'Servidores Públicos': 'servidores_publicos',
  'Direito Penal': 'Penal'
};

export const DB_TO_TOPIC: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_TO_DB).map(([k, v]) => [v, k])
);

export const AREAS = [
  'Administrativa',
  'Judiciária',
  'Policial',
  'Fiscal',
  'Controle',
  'Legislativa',
  'Jurídica'
];

export const BANCAS = [
  'Cebraspe',
  'FGV',
  'FCC',
  'Vunesp',
  'Cesgranrio',
  'Quadrix',
  'Instituto AOCP'
];

export const ORGAOS = [
  'PF',
  'PRF',
  'TJ',
  'TRT',
  'MP',
  'TCU',
  'Receita Federal',
  'INSS'
];