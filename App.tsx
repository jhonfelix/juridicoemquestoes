import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  Award, 
  Play, 
  Bookmark, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Menu, 
  ShieldCheck, 
  TrendingUp, 
  Brain, 
  Zap, 
  Target, 
  LogOut, 
  Loader2, 
  Lock, 
  Check, 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Lightbulb, 
  Info, 
  Trophy, 
  PieChart, 
  UserCog, 
  MapPin, 
  Phone, 
  CreditCard, 
  User, 
  Briefcase, 
  Layers, 
  Flag,
  FileText,
  Landmark,
  Building,
  Star,
  Crown
} from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { GameState, Question, UserProfile, QuizConfig, QuestionDifficulty, DbCategory, TopicStat } from './types';
import { LEVELS, TOPIC_TO_DB, DB_TO_TOPIC, INITIAL_USER, AREAS, BANCAS, ORGAOS } from './constants';
import { generateQuestions, sendChatMessage, ChatMessage, generateStudyHint } from './services/geminiService';
import XPChart from './components/XPChart';

// --- Helpers ---

// Map Index (0-3) to Char (A-D)
const idxToChar = (i: number) => String.fromCharCode(65 + i);
const charToIdx = (c: string) => {
    if (!c) return 0; // Default to 0 (A) if undefined/null to prevent crash
    const upper = String(c).toUpperCase();
    if (upper.length === 1 && upper >= 'A' && upper <= 'Z') {
        return upper.charCodeAt(0) - 65;
    }
    // Handle cases where answer might be '0', '1', etc stored as string
    const num = parseInt(c, 10);
    if (!isNaN(num)) return num;
    return 0;
};

// Formatter for AI Text with improved readability
const formatAiText = (text: string) => {
  if (!text) return null;
  const lines = text.split(/\n/g);
  
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-4" />;

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
            <h4 key={index} className="text-jur-gold-400 font-serif font-bold text-xl mt-6 mb-3 border-b border-jur-gold-500/20 pb-1">
                {trimmed.replace(/\*\*/g, '')}
            </h4>
        );
    }
    
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={index} className="text-slate-200 text-lg leading-loose mb-2 font-light">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={j} className="text-white font-bold bg-jur-blue-800/50 px-1 rounded">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
};

// --- Components ---

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: email.split('@')[0] } }
        });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
      
      if (result.data.user) {
         const { error: profileError } = await supabase.from('profiles').upsert({
             id: result.data.user.id,
             username: email.split('@')[0],
             updated_at: new Date().toISOString(),
             pontos: 0,
             total_acertos: 0,
             total_erros: 0,
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
         }, { onConflict: 'id', ignoreDuplicates: true });
         
         if (profileError) console.error("Profile creation error", profileError);
         onLogin();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-jur-blue-950 p-4">
      <div className="w-full max-w-md bg-jur-blue-900 border border-jur-blue-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="w-16 h-16 text-jur-gold-400 mb-4" />
          <h1 className="text-3xl font-serif font-bold text-white">JurisMinds</h1>
          <p className="text-slate-400 mt-2">Plataforma de Alta Performance Jurídica</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-jur-blue-950 border border-jur-blue-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-jur-gold-500 focus:outline-none" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-jur-blue-950 border border-jur-blue-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-jur-gold-500 focus:outline-none" placeholder="••••••••" />
          </div>
          {error && <div className="bg-red-900/20 border border-red-800 p-3 rounded text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-jur-gold-500 hover:bg-jur-gold-400 text-jur-blue-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2">
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 hover:text-jur-gold-400 text-sm transition-colors">
            {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ChatBot Component
const ChatBot = ({ isOpen, setIsOpen, context }: { isOpen: boolean, setIsOpen: (v: boolean) => void, context: string | null }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: 'Olá! Sou seu tutor jurídico. Como posso ajudar?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (isOpen && !isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    let messageToSend = input;
    if (context) messageToSend = `[CONTEXTO DA QUESTÃO ATUAL]:\n${context}\n\n[DÚVIDA]:\n${input}`;
    const responseText = await sendChatMessage(messages, messageToSend);
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  if (!isOpen) return null;
  if (isMinimized) return (
      <div className="fixed bottom-6 right-6 bg-jur-blue-900 border border-jur-blue-700 w-72 rounded-t-xl z-50 shadow-2xl cursor-pointer" onClick={() => setIsMinimized(false)}>
        <div className="p-3 bg-jur-blue-800 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-bold text-white text-sm">Tutor IA</span></div>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}><X size={16} className="text-slate-400 hover:text-white" /></button>
        </div>
      </div>
  );

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-jur-blue-950 border border-jur-blue-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
      <div className="p-4 bg-jur-blue-900 border-b border-jur-blue-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2"><Brain className="text-jur-gold-500 w-5 h-5" /><span className="font-serif font-bold text-white">Tutor Jurídico</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="text-slate-400 hover:text-white"><Minimize2 size={18} /></button>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-400"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-jur-blue-950">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-jur-gold-500 text-jur-blue-950 font-medium rounded-tr-none' : 'bg-jur-blue-800 text-slate-200 border border-jur-blue-700 rounded-tl-none'}`}>{msg.text}</div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="bg-jur-blue-800 p-3 rounded-2xl rounded-tl-none border border-jur-blue-700"><Loader2 className="w-4 h-4 animate-spin text-jur-gold-500" /></div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 bg-jur-blue-900 border-t border-jur-blue-800 shrink-0 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Tire sua dúvida..." className="flex-1 bg-jur-blue-950 text-white border border-jur-blue-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-jur-gold-500 transition-colors" />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-jur-gold-500 hover:bg-jur-gold-400 disabled:opacity-50 text-jur-blue-950 p-2 rounded-lg transition-colors"><Send size={18} /></button>
      </div>
    </div>
  );
};

// Sidebar
const Sidebar = ({ activeState, onChangeState, onLogout }: { activeState: GameState, onChangeState: (s: GameState) => void, onLogout: () => void }) => (
  <div className="w-16 lg:w-64 bg-jur-blue-900 border-r border-jur-blue-800 flex flex-col items-center lg:items-start p-4 transition-all sticky top-0 h-screen z-20 justify-between">
    <div className="w-full flex flex-col items-center lg:items-start">
      <div className="flex items-center gap-3 mb-10 text-jur-gold-400"><ShieldCheck className="w-8 h-8" /><h1 className="hidden lg:block text-xl font-serif font-bold tracking-wider">JurisMinds</h1></div>
      <nav className="space-y-4 w-full">
        <NavBtn icon={<TrendingUp />} label="Dashboard" active={activeState === GameState.DASHBOARD} onClick={() => onChangeState(GameState.DASHBOARD)} />
        <NavBtn icon={<Play />} label="Novo Simulado" active={activeState === GameState.SETUP_QUIZ} onClick={() => onChangeState(GameState.SETUP_QUIZ)} />
        <NavBtn icon={<FileText />} label="Questões de Prova" active={activeState === GameState.EXAM_SETUP} onClick={() => onChangeState(GameState.EXAM_SETUP)} />
        <NavBtn icon={<Bookmark />} label="Revisão" active={activeState === GameState.REVIEW_LIST} onClick={() => onChangeState(GameState.REVIEW_LIST)} />
        <NavBtn icon={<UserCog />} label="Área do Candidato" active={activeState === GameState.CANDIDATE_AREA} onClick={() => onChangeState(GameState.CANDIDATE_AREA)} />
      </nav>
    </div>
    <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors mt-auto"><LogOut size={20} /><span className="hidden lg:block font-medium">Sair</span></button>
  </div>
);

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-colors ${active ? 'bg-jur-blue-800 text-jur-gold-400' : 'text-slate-400 hover:bg-jur-blue-800/50 hover:text-slate-200'}`}>
    {React.cloneElement(icon, { size: 20 })}<span className="hidden lg:block font-medium">{label}</span>
  </button>
);

// Dashboard
const Dashboard = ({ user, onStartQuiz }: { user: UserProfile, onStartQuiz: () => void }) => {
  const nextLevel = LEVELS[user.level + 1] || LEVELS[user.level];
  const currentLevelInfo = LEVELS[user.level];
  const prevLevelXP = LEVELS[user.level].minXP;

  return (
    <div className="p-4 md:p-8 animate-fade-in w-full max-w-[1600px] mx-auto pb-20">
      <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-xl md:text-3xl font-serif font-bold text-white mb-1 md:mb-2">Olá, {user.name}</h2><p className="text-slate-400 text-xs md:text-base">Sua jornada rumo à aprovação.</p></div>
        <button onClick={onStartQuiz} className="bg-gradient-to-r from-jur-gold-600 to-jur-gold-500 hover:from-jur-gold-500 hover:to-jur-gold-400 text-jur-blue-950 font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-jur-gold-500/20 group">
          <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" /><span className="text-sm md:text-base font-bold whitespace-nowrap">INICIAR NOVO SIMULADO</span><ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
        </button>
      </header>
      <div className="space-y-6">
        <div className="w-full bg-jur-blue-900 rounded-xl p-4 md:p-6 border border-jur-blue-800 shadow-xl flex flex-row items-center justify-between relative overflow-hidden gap-4">
          <div className="z-10 text-left flex-1">
            <div className="flex items-center justify-start gap-2 text-jur-gold-500 mb-1 font-semibold tracking-widest uppercase text-[10px] md:text-xs">Nível Atual</div>
            <div className="text-lg md:text-4xl font-serif font-bold text-white mb-1 flex items-center justify-start gap-2"><span className="text-2xl md:text-4xl">{currentLevelInfo.icon}</span> <span className="leading-tight">{currentLevelInfo.name}</span></div>
            <p className="text-xs md:text-sm text-slate-400">Próximo: {nextLevel.name}</p>
          </div>
          <div className="z-10 flex-shrink-0 w-24 h-24 md:w-48 md:h-48"><XPChart currentXP={user.xp} nextLevelXP={nextLevel.minXP} prevLevelXP={prevLevelXP} /></div>
          <div className="absolute right-0 top-0 w-32 h-32 md:w-64 md:h-64 bg-jur-gold-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>
        <div className="w-full bg-jur-blue-900 rounded-xl p-4 md:p-6 border border-jur-blue-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4 md:mb-6 text-jur-gold-400"><Target className="w-5 h-5" /><h3 className="font-serif font-bold text-base md:text-lg text-white">Central de Desempenho</h3></div>
          <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
             <div className="bg-jur-blue-950/50 p-3 md:p-4 rounded-lg border border-jur-blue-800 flex flex-col items-center justify-center"><span className="text-slate-400 text-[10px] md:text-xs uppercase tracking-wider mb-1 text-center">Questões</span><span className="text-lg md:text-2xl font-bold text-white">{user.questionsAnswered}</span></div>
             <div className="bg-jur-blue-950/50 p-3 md:p-4 rounded-lg border border-jur-blue-800 flex flex-col items-center justify-center relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div><span className="text-emerald-400 text-[10px] md:text-xs uppercase tracking-wider mb-1 font-bold text-center">Precisão</span><span className="text-2xl md:text-3xl font-bold text-emerald-400">{user.questionsAnswered > 0 ? Math.round((user.correctAnswers / user.questionsAnswered) * 100) : 0}%</span></div>
          </div>
          <div className="w-full h-px bg-jur-blue-800 mb-4 md:mb-6"></div>
          <h4 className="text-slate-300 font-semibold mb-3 text-xs md:text-sm">Precisão por Área</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(TOPIC_TO_DB).map((topic) => {
               const stats = user.topicStats?.[topic] || { answered: 0, correct: 0 };
               const percentage = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
               let barColor = 'bg-slate-600';
               let textColor = 'text-slate-400';
               if (stats.answered > 0) { if (percentage >= 80) { barColor = 'bg-emerald-500'; textColor = 'text-emerald-400'; } else if (percentage >= 60) { barColor = 'bg-jur-gold-500'; textColor = 'text-jur-gold-400'; } else { barColor = 'bg-red-500'; textColor = 'text-red-400'; } }
               return (
                 <div key={topic} className="flex flex-col gap-1 p-2 md:p-3 rounded-lg hover:bg-jur-blue-800/50 transition-colors">
                    <div className="flex justify-between items-center text-xs md:text-sm mb-1"><span className="text-slate-200 font-medium truncate pr-2">{topic}</span><span className={`font-bold ${textColor}`}>{percentage}%</span></div>
                    <div className="w-full bg-jur-blue-950 h-1.5 md:h-2 rounded-full overflow-hidden border border-jur-blue-800"><div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div></div>
                    <div className="text-[10px] md:text-xs text-slate-500 text-right mt-1">{stats.correct}/{stats.answered} acertos</div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ReviewList
const ReviewList = ({ userId, onStartReview }: { userId: string, onStartReview: (questions: Question[]) => void }) => {
  const [reviews, setReviews] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('questoes_revisao').select('*').eq('user_id', userId);
        if (error) throw error;
        const grouped: Record<string, Question[]> = {};
        data?.forEach((row: any) => {
            const topic = row.assunto || 'Sem Categoria';
            if (!grouped[topic]) grouped[topic] = [];
            const q: Question = {
                id: row.id,
                topic: row.assunto || 'Geral',
                dbCategory: 'Administrativo',
                enunciado: row.enunciado,
                options: Array.isArray(row.opcoes) ? row.opcoes : JSON.parse(row.opcoes || '[]'),
                correctAnswerIndex: typeof row.resposta_correta === 'number' ? row.resposta_correta : charToIdx(row.resposta_correta || 'A'),
                explanation: row.explicacao || "Explicação não disponível.",
                difficulty: 'Médio',
                isMarkedForReview: true,
                aiHint: row.explicacao_ia
            };
            grouped[topic].push(q);
        });
        setReviews(grouped);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (userId) fetchReviews();
  }, [userId]);

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-jur-gold-400 gap-4 animate-pulse"><Loader2 className="w-10 h-10 animate-spin" /><p>Carregando...</p></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
       <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3 text-jur-gold-400"><Bookmark className="w-8 h-8" /><h2 className="text-xl md:text-3xl font-serif font-bold text-white">Central de Revisão</h2></div></div>
       {Object.keys(reviews).length === 0 ? (
           <div className="bg-jur-blue-900/50 border border-jur-blue-800 rounded-xl p-8 text-center flex flex-col items-center justify-center h-64"><div className="bg-emerald-900/20 p-4 rounded-full mb-4"><CheckCircle className="w-12 h-12 text-emerald-500" /></div><p className="text-xl text-white font-serif font-bold mb-2">Tudo em dia!</p></div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
               {Object.entries(reviews).map(([topic, qs]) => {
                   const questions = qs as Question[];
                   return (
                   <button key={topic} onClick={() => onStartReview(questions)} className="flex flex-col bg-jur-blue-900 border border-jur-blue-800 hover:border-jur-gold-500/50 hover:bg-jur-blue-800 p-6 rounded-xl text-left group relative overflow-hidden">
                       <h3 className="font-bold text-white text-lg mb-4 relative z-10 leading-tight min-h-[3rem] line-clamp-2">{topic}</h3>
                       <div className="mt-auto w-full"><div className="flex items-center justify-between text-sm font-medium relative z-10 mb-3"><span className="text-slate-400">{questions.length} questões</span></div><div className="flex items-center justify-center w-full py-2 rounded-lg bg-jur-blue-950 border border-jur-blue-800 text-slate-300 group-hover:text-jur-gold-400 transition-all text-sm font-bold gap-2"><Play size={16} /> REFAZER AGORA</div></div>
                   </button>
                   );
               })}
           </div>
       )}
    </div>
  );
};

// CandidateArea
const CandidateArea = ({ user, onUpdateProfile }: { user: UserProfile, onUpdateProfile: (updates: Partial<UserProfile>) => void }) => {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [city, setCity] = useState(user.address || ''); // Using address field for City/State
    const [saving, setSaving] = useState(false);
    
    // Plans Definition
    const plans = [
        { id: 'free', name: 'Gratuito', price: 'R$ 0,00', period: 'Vitalício', features: ['10 Questões/dia', 'Simulados Básicos', 'Anúncios'], active: !user.subscriptionPlan || user.subscriptionPlan === 'free', color: 'border-slate-600', btnClass: 'bg-slate-700 hover:bg-slate-600' },
        { id: 'monthly', name: 'Mensal', price: 'R$ 29,90', period: '/mês', features: ['Questões Ilimitadas', 'Tutor IA Avançado', 'Sem Anúncios', 'Dashboards Detalhados'], active: user.subscriptionPlan === 'monthly', color: 'border-jur-gold-500', btnClass: 'bg-jur-gold-500 hover:bg-jur-gold-400 text-jur-blue-950', popular: false },
        { id: 'biannual', name: 'Semestral', price: 'R$ 149,90', period: '/6 meses', features: ['Economia de 15%', 'Acesso Antecipado', 'Suporte Prioritário'], active: user.subscriptionPlan === 'biannual', color: 'border-emerald-500', btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-jur-blue-950', popular: false },
        { id: 'annual', name: 'Anual', price: 'R$ 239,90', period: '/ano', features: ['Melhor Valor', 'Mentorias Exclusivas', 'Todas as Vantagens', 'Certificado de Conclusão'], active: user.subscriptionPlan === 'annual', color: 'border-purple-500', btnClass: 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white', popular: true }
    ];

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // Mapping city input to address field in DB
            await supabase.from('profiles').update({ username: name, phone: phone, address: city }).eq('id', user.id);
            onUpdateProfile({ name, phone, address: city });
            alert("Perfil atualizado com sucesso!");
        } catch (e) { console.error(e); alert("Erro ao salvar."); } finally { setSaving(false); }
    };

    const handleSubscribe = async (planId: string) => {
        if (planId === user.subscriptionPlan) return;
        if (confirm(`Deseja alterar seu plano para ${planId}?`)) {
             try {
                 await supabase.from('profiles').update({ subscriptionPlan: planId }).eq('id', user.id);
                 onUpdateProfile({ subscriptionPlan: planId as any });
                 alert("Plano atualizado! Bem-vindo ao novo nível.");
             } catch(e) { console.error(e); }
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto animate-fade-in pb-20">
            <header className="mb-8 flex items-center gap-4 text-jur-gold-400 border-b border-jur-blue-800 pb-6">
                <div className="bg-jur-blue-900 p-3 rounded-xl border border-jur-blue-700">
                    <UserCog className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-4xl font-serif font-bold text-white">Área do Candidato</h2>
                    <p className="text-slate-400 text-sm md:text-base mt-1">Gerencie seus dados e impulsione seus estudos</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Personal Info Section */}
                <div className="lg:col-span-1">
                    <div className="bg-jur-blue-900 border border-jur-blue-800 rounded-2xl p-6 shadow-xl sticky top-6">
                         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><User size={20} className="text-jur-gold-500"/> Dados Pessoais</h3>
                         <div className="space-y-5">
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                                 <div className="relative">
                                     <User className="absolute left-3 top-3 text-slate-500" size={18} />
                                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-jur-blue-950 border border-jur-blue-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-jur-gold-500 focus:border-transparent transition-all" placeholder="Seu nome" />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cidade / Estado</label>
                                 <div className="relative">
                                     <MapPin className="absolute left-3 top-3 text-slate-500" size={18} />
                                     <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-jur-blue-950 border border-jur-blue-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-jur-gold-500 focus:border-transparent transition-all" placeholder="Ex: Brasília - DF" />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Telefone / WhatsApp</label>
                                 <div className="relative">
                                     <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                                     <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-jur-blue-950 border border-jur-blue-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-jur-gold-500 focus:border-transparent transition-all" placeholder="(00) 00000-0000" />
                                 </div>
                             </div>
                             <div className="pt-4">
                                 <button onClick={handleSaveProfile} disabled={saving} className="w-full bg-jur-blue-800 hover:bg-jur-gold-500 hover:text-jur-blue-950 border border-jur-blue-700 hover:border-jur-gold-500 text-slate-200 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg">
                                     {saving ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Salvar Alterações</>}
                                 </button>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Subscription Plans Section */}
                <div className="lg:col-span-2">
                    <div className="bg-jur-blue-900/50 border border-jur-blue-800/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-8">
                             <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard size={24} className="text-emerald-500"/> Planos e Assinaturas</h3>
                             {user.subscriptionPlan && user.subscriptionPlan !== 'free' && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wide">Membro Premium</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => (
                                <div key={plan.id} className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${plan.active ? `${plan.color} bg-jur-blue-800 shadow-2xl scale-[1.02]` : 'border-jur-blue-800 bg-jur-blue-950 hover:border-jur-blue-600 hover:bg-jur-blue-900'}`}>
                                    {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1"><Crown size={12}/> Mais Popular</div>}
                                    <div className="mb-4">
                                        <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                                        <div className="flex items-baseline mt-2">
                                            <span className="text-2xl font-bold text-white">{plan.price}</span>
                                            <span className="text-sm text-slate-400 ml-1">{plan.period}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-3 mb-6 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                                <div className={`mt-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center ${plan.active ? 'bg-emerald-500 text-jur-blue-950' : 'bg-jur-blue-800 text-slate-500'}`}><Check size={10} strokeWidth={4} /></div>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button 
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={plan.active}
                                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${plan.active ? 'bg-jur-blue-950 border border-jur-blue-700 text-slate-400 cursor-default opacity-70' : plan.btnClass} shadow-lg`}
                                    >
                                        {plan.active ? <><CheckCircle size={16}/> Plano Atual</> : <><Star size={16}/> Escolher {plan.name}</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// QuizSetup
const QuizSetup = ({ onStart }: { onStart: (config: QuizConfig) => void }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isAreasOpen, setIsAreasOpen] = useState(false);

  useEffect(() => {
     const fetchAreas = async () => {
        try {
            const { data } = await supabase.from('questions').select('area');
            if (data) setAvailableAreas(Array.from(new Set(data.map((item: any) => item.area).filter(Boolean))).sort());
        } catch (e) { console.error(e); setAvailableAreas(AREAS); }
     };
     fetchAreas();
  }, []);

  const toggleTopic = (t: string) => setSelectedTopics(p => p.includes(t) ? p.filter(i => i !== t) : [...p, t]);
  const toggleArea = (a: string) => setSelectedAreas(p => p.includes(a) ? p.filter(i => i !== a) : [...p, a]);

  return (
    <div className="flex items-center justify-center h-full p-4 md:p-6 overflow-y-auto">
      <div className="bg-jur-blue-900 border border-jur-blue-800 p-6 md:p-8 rounded-2xl max-w-2xl w-full shadow-2xl animate-fade-in my-auto flex flex-col">
        <div className="flex items-center gap-3 mb-6 text-jur-gold-400 border-b border-jur-blue-800 pb-4"><Brain className="w-8 h-8" /><h2 className="text-xl md:text-2xl font-serif font-bold text-white">Configurar Simulado</h2></div>
        <div className="space-y-4 mb-8">
            <div className="relative">
                <button onClick={() => { setIsTopicsOpen(!isTopicsOpen); setIsAreasOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-xl border ${isTopicsOpen ? 'bg-jur-blue-800 border-jur-gold-500' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}><div className="flex items-center gap-3"><BookOpen size={20} className="text-jur-gold-500"/><span className="font-bold">Filtrar por Disciplina</span></div>{isTopicsOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>
                {isTopicsOpen && (<div className="absolute top-full left-0 w-full z-20 mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl shadow-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar">{Object.keys(TOPIC_TO_DB).map(t => (<label key={t} className="flex items-center gap-3 p-2 rounded-lg hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedTopics.includes(t)} onChange={() => toggleTopic(t)} className="w-5 h-5 rounded bg-jur-blue-950 accent-jur-gold-500" /><span className="text-slate-300">{t}</span></label>))}</div>)}
            </div>
            <div className="relative">
                <button onClick={() => { setIsAreasOpen(!isAreasOpen); setIsTopicsOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-xl border ${isAreasOpen ? 'bg-jur-blue-800 border-emerald-500' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}><div className="flex items-center gap-3"><Briefcase size={20} className="text-emerald-500"/><span className="font-bold">Filtrar por Área</span></div>{isAreasOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>
                {isAreasOpen && (<div className="absolute top-full left-0 w-full z-20 mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl shadow-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar"><div className="space-y-2">{availableAreas.map(a => (<label key={a} className="flex items-center gap-3 p-2 rounded-lg hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedAreas.includes(a)} onChange={() => toggleArea(a)} className="w-5 h-5 rounded bg-jur-blue-950 accent-emerald-500" /><span className="text-slate-300">{a}</span></label>))}</div></div>)}
            </div>
        </div>
        <div className="bg-jur-blue-950/30 p-4 rounded-xl border border-jur-blue-800 mb-6"><label className="block text-sm font-medium text-slate-400 mb-3 text-center">Quantidade de Questões</label><div className="flex justify-center gap-4">{[10, 15, 20].map(num => (<button key={num} onClick={() => setCount(num)} className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-all ${count === num ? 'bg-jur-gold-500 border-jur-gold-500 text-jur-blue-950' : 'bg-transparent border-jur-blue-800 text-slate-400'}`}>{num}</button>))}</div></div>
        <button onClick={() => onStart({ topics: selectedTopics, areas: selectedAreas, count })} className="w-full bg-gradient-to-r from-jur-gold-600 to-jur-gold-500 hover:from-jur-gold-500 hover:to-jur-gold-400 text-jur-blue-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Play size={24} /> Iniciar Simulado Agora</button>
      </div>
    </div>
  );
};

// ExamSetup - Strict DB Filtering
const ExamSetup = ({ onStart }: { onStart: (config: QuizConfig) => void }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedBancas, setSelectedBancas] = useState<string[]>([]);
  const [selectedOrgaos, setSelectedOrgaos] = useState<string[]>([]);
  
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availableBancas, setAvailableBancas] = useState<string[]>([]);
  const [availableOrgaos, setAvailableOrgaos] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  
  const [count, setCount] = useState(10);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
     const fetchFilters = async () => {
        setIsLoadingFilters(true);
        try {
            const { data: qData, error } = await supabase
                .from('questao_prova')
                .select('disciplina, area, banca, orgao');
            
            if (error) throw error;

            if (qData) {
                const uniqueDisciplinas = Array.from(new Set(qData.map((i: any) => i.disciplina).filter(Boolean)));
                const mappedTopics = uniqueDisciplinas.map(d => {
                   const s = d as string;
                   // If s is a slug (e.g. "administrativo"), map it to "Direito Administrativo".
                   // If s is already a name ("Direito Administrativo"), DB_TO_TOPIC[s] is undefined, so keep s.
                   return DB_TO_TOPIC[s] || s;
                }).sort();

                const uniqueAreas = Array.from(new Set(qData.map((i: any) => i.area).filter(Boolean))).sort();
                const uniqueBancas = Array.from(new Set(qData.map((i: any) => i.banca).filter(Boolean))).sort();
                const uniqueOrgaos = Array.from(new Set(qData.map((i: any) => i.orgao).filter(Boolean))).sort();
                
                setAvailableTopics(mappedTopics as string[]);
                setAvailableAreas(uniqueAreas as string[]);
                setAvailableBancas(uniqueBancas as string[]);
                setAvailableOrgaos(uniqueOrgaos as string[]);
            }
        } catch (e) {
            console.error("Error fetching filters:", e);
            // Fallbacks
            setAvailableTopics(Object.keys(TOPIC_TO_DB));
            setAvailableAreas(AREAS); 
            setAvailableBancas([]); 
            setAvailableOrgaos([]);
        } finally {
            setIsLoadingFilters(false);
        }
     };
     fetchFilters();
  }, []);

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>, item: string) => { set(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
  const remove = (set: React.Dispatch<React.SetStateAction<string[]>>, item: string) => { set(prev => prev.filter(i => i !== item)); };
  const toggleAccordion = (id: string) => setActiveAccordion(activeAccordion === id ? null : id);

  return (
    <div className="flex items-center justify-center h-full p-4 md:p-6 overflow-y-auto">
      <div className="bg-jur-blue-900 border border-jur-blue-800 p-6 md:p-8 rounded-2xl max-w-2xl w-full shadow-2xl animate-fade-in my-auto flex flex-col">
        <div className="flex items-center gap-3 mb-6 text-jur-gold-400 border-b border-jur-blue-800 pb-4">
          <FileText className="w-8 h-8" />
          <div className="flex flex-col"><h2 className="text-xl md:text-2xl font-serif font-bold text-white">Questões de Prova</h2><span className="text-xs text-slate-400 font-normal">Filtros baseados na base de dados atual</span></div>
        </div>
        
        <div className="space-y-3 mb-6">
            <div className="relative">
                <button onClick={() => toggleAccordion('topics')} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeAccordion === 'topics' ? 'bg-jur-blue-800 border-jur-gold-500 text-white' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}>
                    <div className="flex items-center gap-3"><BookOpen size={18} className="text-jur-gold-500"/><span className="font-bold">Disciplina</span></div>{activeAccordion === 'topics' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {activeAccordion === 'topics' && (<div className="mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">{availableTopics.map(t => (<label key={t} className="flex items-center gap-3 p-2 rounded hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedTopics.includes(t)} onChange={() => toggle(setSelectedTopics, t)} className="w-4 h-4 rounded bg-jur-blue-950 accent-jur-gold-500" /><span className="text-sm text-slate-300">{t}</span></label>))}</div>)}
            </div>

            <div className="relative">
                <button onClick={() => toggleAccordion('areas')} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeAccordion === 'areas' ? 'bg-jur-blue-800 border-emerald-500 text-white' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}>
                    <div className="flex items-center gap-3"><Briefcase size={18} className="text-emerald-500"/><span className="font-bold">Área</span></div>{activeAccordion === 'areas' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {activeAccordion === 'areas' && (<div className="mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">{availableAreas.map(a => (<label key={a} className="flex items-center gap-3 p-2 rounded hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedAreas.includes(a)} onChange={() => toggle(setSelectedAreas, a)} className="w-4 h-4 rounded bg-jur-blue-950 accent-emerald-500" /><span className="text-sm text-slate-300">{a}</span></label>))}</div>)}
            </div>

            <div className="relative">
                <button onClick={() => toggleAccordion('bancas')} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeAccordion === 'bancas' ? 'bg-jur-blue-800 border-purple-500 text-white' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}>
                    <div className="flex items-center gap-3"><Landmark size={18} className="text-purple-500"/><span className="font-bold">Banca</span></div>{activeAccordion === 'bancas' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {activeAccordion === 'bancas' && (<div className="mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">{availableBancas.length === 0 ? <p className="text-sm text-slate-500 p-2 italic">Nenhuma banca encontrada.</p> : availableBancas.map(b => (<label key={b} className="flex items-center gap-3 p-2 rounded hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedBancas.includes(b)} onChange={() => toggle(setSelectedBancas, b)} className="w-4 h-4 rounded bg-jur-blue-950 accent-purple-500" /><span className="text-sm text-slate-300">{b}</span></label>))}</div>)}
            </div>

            <div className="relative">
                <button onClick={() => toggleAccordion('orgaos')} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeAccordion === 'orgaos' ? 'bg-jur-blue-800 border-pink-500 text-white' : 'bg-jur-blue-950/50 border-jur-blue-800 text-slate-300'}`}>
                    <div className="flex items-center gap-3"><Building size={18} className="text-pink-500"/><span className="font-bold">Órgão</span></div>{activeAccordion === 'orgaos' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                {activeAccordion === 'orgaos' && (<div className="mt-2 bg-jur-blue-800 border border-jur-blue-700 rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">{availableOrgaos.length === 0 ? <p className="text-sm text-slate-500 p-2 italic">Nenhum órgão encontrado.</p> : availableOrgaos.map(o => (<label key={o} className="flex items-center gap-3 p-2 rounded hover:bg-jur-blue-900/50 cursor-pointer"><input type="checkbox" checked={selectedOrgaos.includes(o)} onChange={() => toggle(setSelectedOrgaos, o)} className="w-4 h-4 rounded bg-jur-blue-950 accent-pink-500" /><span className="text-sm text-slate-300">{o}</span></label>))}</div>)}
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={14}/> Filtros Selecionados</h3>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-jur-blue-950/30 rounded-xl border border-jur-blue-800/50 items-center">
                {selectedTopics.length === 0 && selectedAreas.length === 0 && selectedBancas.length === 0 && selectedOrgaos.length === 0 && (<div className="flex items-center gap-2 text-slate-400 text-sm italic"><Sparkles size={16} /> Aleatório (Toda a Base)</div>)}
                {selectedTopics.map(t => (<span key={t} className="tag bg-jur-gold-500 text-jur-blue-950 border-jur-gold-400/50">{t}<button onClick={() => remove(setSelectedTopics, t)}><X size={12}/></button></span>))}
                {selectedAreas.map(a => (<span key={a} className="tag bg-emerald-500 text-emerald-950 border-emerald-400/50">{a}<button onClick={() => remove(setSelectedAreas, a)}><X size={12}/></button></span>))}
                {selectedBancas.map(b => (<span key={b} className="tag bg-purple-500 text-purple-950 border-purple-400/50">{b}<button onClick={() => remove(setSelectedBancas, b)}><X size={12}/></button></span>))}
                {selectedOrgaos.map(o => (<span key={o} className="tag bg-pink-500 text-pink-950 border-pink-400/50">{o}<button onClick={() => remove(setSelectedOrgaos, o)}><X size={12}/></button></span>))}
            </div>
        </div>

        <div className="bg-jur-blue-950/30 p-4 rounded-xl border border-jur-blue-800 mb-6"><label className="block text-sm font-medium text-slate-400 mb-3 text-center">Quantidade de Questões</label><div className="flex justify-center gap-4">{[10, 15, 20].map(num => (<button key={num} onClick={() => setCount(num)} className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-all ${count === num ? 'bg-jur-gold-500 border-jur-gold-500 text-jur-blue-950' : 'bg-transparent border-jur-blue-800 text-slate-400 hover:border-slate-500'}`}>{num}</button>))}</div></div>
        <button onClick={() => onStart({ topics: selectedTopics, areas: selectedAreas, bancas: selectedBancas, orgaos: selectedOrgaos, count, isExamMode: true })} className="w-full bg-gradient-to-r from-jur-gold-600 to-jur-gold-500 hover:from-jur-gold-500 hover:to-jur-gold-400 text-jur-blue-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-jur-gold-500/20 text-lg"><Play size={24} /> Gerar Caderno de Prova</button>
      </div>
      <style>{`.tag { @apply inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold animate-fade-in border; } .tag button { @apply hover:text-white transition-colors; }`}</style>
    </div>
  );
};

// QuizSession
const QuizSession = ({ config, user, onFinish, onUpdateUser, onOpenChat, preloadedQuestions, isReviewMode }: { config: QuizConfig, user: UserProfile, onFinish: () => void, onUpdateUser: () => void, onOpenChat: (ctx: string) => void, preloadedQuestions?: Question[], isReviewMode?: boolean }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [simuladoId, setSimuladoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [hintContent, setHintContent] = useState<string | null>(null);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const answerLockRef = useRef(false);

  useEffect(() => { answerLockRef.current = false; }, [currentIndex]);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => { setNotification({ message: msg, type }); setTimeout(() => setNotification(null), 3000); };

  useEffect(() => {
    const fetchAndPersistQuestions = async () => {
      if (preloadedQuestions && preloadedQuestions.length > 0) { setQuestions(preloadedQuestions); setLoading(false); return; }
      try {
        const { data: simuladoData, error: simError } = await supabase.from('simulados').insert({ user_id: user.id, assuntos: config.topics.length > 0 ? config.topics : ['Geral/Aleatório'], quantidade_questoes: config.count, status: 'em_andamento' }).select().single();
        if (simError) throw simError;
        setSimuladoId(simuladoData.id);

        // Force 'questao_prova' if isExamMode is set (from ExamSetup), otherwise fallback to checking filters or 'questions' table.
        const isExamMode = config.isExamMode || (config.bancas && config.bancas.length > 0) || (config.orgaos && config.orgaos.length > 0);
        const tableName = isExamMode ? 'questao_prova' : 'questions';

        let query = supabase.from(tableName).select('*');
        
        if (config.topics.length > 0) {
            if (isExamMode) {
                // For questao_prova, use 'disciplina' which contains display names
                query = query.in('disciplina', config.topics);
            } else {
                // For questions table, use 'categoria' with mapped slugs
                const dbCategories = config.topics.flatMap(t => {
                    const val = TOPIC_TO_DB[t];
                    if (val === 'constitucional' || val === 'Constitucional') return ['constitucional', 'Constitucional'];
                    if (val === 'administrativo' || val === 'Administrativo') return ['administrativo', 'Administrativo'];
                    if (val === 'penal' || val === 'Penal') return ['penal', 'Penal'];
                    return [val];
                });
                query = query.in('categoria', dbCategories);
            }
        }
        if (config.areas.length > 0) query = query.in('area', config.areas);
        if (config.bancas && config.bancas.length > 0) query = query.in('banca', config.bancas);
        if (config.orgaos && config.orgaos.length > 0) query = query.in('orgao', config.orgaos);

        let fetchedQuestions: any[] = [];
        const { data: dbData } = await query;
        if (dbData) fetchedQuestions = dbData;

        // If not enough questions in default mode, generate via AI (Only for 'questions' table)
        if (fetchedQuestions.length < config.count && !isExamMode) {
           try {
             const needed = config.count - fetchedQuestions.length;
             const generated = await generateQuestions(config.topics, config.areas, needed, 'Médio', config.bancas, config.orgaos);
             const toInsert = generated.map(g => ({ categoria: TOPIC_TO_DB[g.topic] || 'administrativo', enunciado: g.enunciado, alternativas: g.options, resposta_correta: g.correctAnswerIndex, explicacao_ia: g.explanation, dificuldade: g.difficulty, area: g.area || 'Geral', banca: g.banca, orgao: g.orgao }));
             const { data: insertedData } = await supabase.from('questions').insert(toInsert).select();
             if (insertedData) fetchedQuestions = [...fetchedQuestions, ...insertedData];
             else fetchedQuestions = [...fetchedQuestions, ...generated.map(g => ({ ...g, id: g.id, categoria: TOPIC_TO_DB[g.topic] || 'administrativo', alternativas: g.options, resposta_correta: g.correctAnswerIndex, explicacao_ia: g.explanation }))];
           } catch (genError) { console.error("AI Gen Failed", genError); }
        }
        if (fetchedQuestions.length === 0) throw new Error("Não foi possível carregar questões. Verifique os filtros ou tente o modo Aleatório.");

        const shuffled = [...fetchedQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
        
        setQuestions(shuffled.slice(0, config.count).map((q) => {
            let safeOptions: string[] = [];
            let rawOpts = q.alternativas || q.opcoes;
            
            // 1. Attempt to parse if string
            if (typeof rawOpts === 'string') {
                try {
                    rawOpts = JSON.parse(rawOpts);
                    // Handle potential double-encoding
                    if (typeof rawOpts === 'string') {
                        rawOpts = JSON.parse(rawOpts);
                    }
                } catch (e) {
                    console.warn("Error parsing options string:", q.id);
                }
            }

            // 2. Process resulting object/array
            if (Array.isArray(rawOpts)) {
                safeOptions = rawOpts;
            } else if (typeof rawOpts === 'object' && rawOpts !== null) {
                // Handle format: { "a": "text", "b": "text" }
                // Sort keys to ensure A, B, C, D, E order
                safeOptions = Object.keys(rawOpts)
                    .sort() // simple alphabetical sort works for a,b,c,d,e
                    .map(key => rawOpts[key]);
            }
            
            if (safeOptions.length === 0) {
                 safeOptions = ["Opção A", "Opção B", "Opção C", "Opção D"]; // Prevent crash
            }
            
            return {
                id: q.id,
                // Handle difference between 'categoria' (slug) and 'disciplina' (likely name)
                topic: q.disciplina ? q.disciplina : (DB_TO_TOPIC[q.categoria] || q.categoria || 'Geral'),
                dbCategory: (q.categoria || TOPIC_TO_DB[q.disciplina] || 'administrativo') as DbCategory,
                enunciado: q.enunciado || "Enunciado não disponível.",
                options: safeOptions,
                correctAnswerIndex: typeof q.resposta_correta === 'number' ? q.resposta_correta : charToIdx(q.resposta_correta),
                explanation: q.explicacao_ia || q.comentario || "Explicação não disponível.",
                difficulty: 'Médio',
                aiHint: q.explicacao_ia || q.comentario,
                area: q.area,
                banca: q.banca,
                orgao: q.orgao
            };
        }));
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    fetchAndPersistQuestions();
  }, [preloadedQuestions]);

  const handleAnswer = async (index: number) => {
    if (isAnswered || answerLockRef.current) return;
    answerLockRef.current = true;
    setSavingAnswer(true);
    setSelectedOption(index);
    setIsAnswered(true);
    if (!isReviewMode && !simuladoId) { setSavingAnswer(false); return; }
    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    const currentQ = questions[currentIndex];
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].userSelectedAnswer = index;
    setQuestions(updatedQuestions);
    try {
        if (!isReviewMode) {
            await supabase.from('progresso').insert({ user_id: user.id, questao_id: currentQ.id, simulado_id: simuladoId, acertou: isCorrect });
            const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (freshProfile) {
                const updates: any = { total_acertos: isCorrect ? (Number(freshProfile.total_acertos)||0) + 1 : (Number(freshProfile.total_acertos)||0), total_erros: isCorrect ? (Number(freshProfile.total_erros)||0) : (Number(freshProfile.total_erros)||0) + 1, pontos: isCorrect ? (Number(freshProfile.pontos)||0) + 1 : (Number(freshProfile.pontos)||0) };
                await supabase.from('profiles').update(updates).eq('id', user.id);
            }
        }
    } catch (err) { console.error(err); } finally { setSavingAnswer(false); }
  };

  const handleBookmark = async () => {
    const currentQ = questions[currentIndex];
    const newIsMarked = !currentQ.isMarkedForReview;
    setQuestions(questions.map((q, idx) => idx === currentIndex ? { ...q, isMarkedForReview: newIsMarked } : q));
    try {
        if (newIsMarked) {
            await supabase.from('questoes_revisao').insert({ user_id: user.id, id: currentQ.id, assunto: currentQ.topic, enunciado: currentQ.enunciado, opcoes: currentQ.options, resposta_correta: idxToChar(currentQ.correctAnswerIndex), explicacao_ia: currentQ.aiHint });
            showNotification("Adicionada à revisão!", 'success');
        } else {
            await supabase.from('questoes_revisao').delete().eq('user_id', user.id).eq('id', currentQ.id);
            showNotification("Removida da revisão.", 'success');
        }
    } catch (err) { console.error(err); showNotification("Erro ao atualizar.", 'error'); }
  };

  const handleReportSubmit = async () => {
    if (!reportText.trim()) return;
    setIsSubmittingReport(true);
    try {
        // Determine table based on mode
        const tableName = config.isExamMode ? 'relato_problemas_prova' : 'relato_problemas_simulado';
        
        const { error } = await supabase.from(tableName).insert({
            questao_id: questions[currentIndex].id,
            usuario_id: user.id,
            descricao_problema: reportText,
            resolvido: false
        });

        if (error) throw error;
        
        showNotification('Problema relatado. Obrigado!', 'success');
        setIsReportModalOpen(false);
        setReportText('');
    } catch (err) { 
        console.error(err); 
        showNotification('Erro ao relatar.', 'error'); 
    } finally { 
        setIsSubmittingReport(false); 
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) { setCurrentIndex(c => c + 1); setSelectedOption(null); setIsAnswered(false); } else { if (simuladoId) await supabase.from('simulados').update({ status: 'concluido' }).eq('id', simuladoId); onUpdateUser(); setShowSummary(true); }
  };

  const handleTeacherComment = async () => {
    const currentQ = questions[currentIndex];
    if (currentQ.aiHint) { setHintContent(currentQ.aiHint); setHintModalOpen(true); return; }
    setHintContent(null); setHintModalOpen(true); setIsGeneratingHint(true);
    try {
        const generatedHint = await generateStudyHint(currentQ.topic, currentQ.enunciado);
        await supabase.from(isReviewMode ? 'questoes_revisao' : 'questions').update({ explicacao_ia: generatedHint }).eq('id', currentQ.id);
        const qs = [...questions]; qs[currentIndex].aiHint = generatedHint; setQuestions(qs);
        setHintContent(generatedHint);
    } catch (err) { setHintContent("Erro ao gerar comentário."); } finally { setIsGeneratingHint(false); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-jur-gold-400 gap-4 animate-pulse"><Brain className="w-16 h-16" /><p className="text-xl font-serif">Preparando prova...</p></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><p className="text-slate-400 mb-4">{error}</p><button onClick={onFinish} className="bg-jur-blue-800 text-white font-bold py-2 px-6 rounded-lg">Voltar</button></div>;
  const currentQ = questions[currentIndex];

  let totalCorrect = 0;
  if (showSummary) questions.forEach(q => { if (q.userSelectedAnswer === q.correctAnswerIndex) totalCorrect++; });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 h-full flex flex-col relative">
      {showSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-jur-blue-950/90 backdrop-blur-md animate-fade-in">
              <div className="bg-jur-blue-900 border border-jur-blue-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 text-center">
                  <h2 className="text-2xl font-serif font-bold text-white mb-4">Resultado Final</h2>
                  <div className="text-4xl font-bold text-jur-gold-400 mb-2">{totalCorrect}/{questions.length}</div>
                  <p className="text-slate-400 mb-6">Acertos</p>
                  <button onClick={onFinish} className="bg-jur-gold-500 hover:bg-jur-gold-400 text-jur-blue-950 font-bold py-3 px-8 rounded-lg">Voltar ao Menu</button>
              </div>
          </div>
      )}
      {hintModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-jur-blue-900 border border-jur-blue-700 w-full max-w-4xl rounded-2xl p-6 relative flex flex-col max-h-[90vh]">
                  <button onClick={() => setHintModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={32} /></button>
                  <div className="flex items-center gap-4 mb-4 text-jur-gold-400 border-b border-jur-blue-800 pb-4 shrink-0"><Lightbulb className="w-8 h-8" /><h3 className="text-2xl font-serif font-bold text-white">Comentário do Professor</h3></div>
                  <div className="bg-jur-blue-950 p-6 rounded-xl border border-jur-blue-800 flex-1 overflow-y-auto">{isGeneratingHint ? <div className="animate-pulse text-jur-gold-400 flex flex-col items-center justify-center h-full"><Sparkles size={32} /><span>Analisando...</span></div> : formatAiText(hintContent || '')}</div>
              </div>
          </div>
      )}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-jur-blue-900 border border-jur-blue-700 w-full max-w-lg rounded-2xl p-6 relative">
             <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><AlertCircle size={20} className="text-red-400"/> Relatar Problema</h3><button onClick={() => setIsReportModalOpen(false)}><X size={20} className="text-slate-400"/></button></div>
             <textarea className="w-full bg-jur-blue-950 border border-jur-blue-800 rounded-lg p-3 text-white text-sm mb-4 h-32 resize-none" placeholder="Descreva o erro..." value={reportText} onChange={(e) => setReportText(e.target.value)} />
             <div className="flex justify-end gap-2"><button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 rounded text-slate-300">Cancelar</button><button onClick={handleReportSubmit} disabled={isSubmittingReport || !reportText.trim()} className="px-4 py-2 bg-red-500 rounded text-white font-bold">{isSubmittingReport ? <Loader2 className="animate-spin" /> : 'Enviar'}</button></div>
          </div>
        </div>
      )}
      {notification && <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl border z-[60] flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-900/95 border-emerald-500 text-white' : 'bg-red-900/95 border-red-500 text-white'}`}>{notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}<span>{notification.message}</span></div>}

      <div className="flex justify-between items-center mb-6">
        <div>
            <span className="text-slate-400 font-mono text-sm block mb-1">Questão {currentIndex + 1}/{questions.length}</span>
            <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] bg-jur-gold-500/20 text-jur-gold-400 border border-jur-gold-500/30 font-bold uppercase">{currentQ.topic}</span>
                {currentQ.banca && <span className="px-2 py-0.5 rounded text-[10px] bg-purple-900/20 text-purple-400 border border-purple-500/30 font-bold uppercase">{currentQ.banca}</span>}
                {currentQ.orgao && <span className="px-2 py-0.5 rounded text-[10px] bg-pink-900/20 text-pink-400 border border-pink-500/30 font-bold uppercase">{currentQ.orgao}</span>}
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-slate-500 hover:text-red-400"><Flag size={18} /></button>
            <button onClick={() => onOpenChat(`Questão: ${currentQ.enunciado}\nAlternativas: ${currentQ.options.join('\n')}`)} className="flex items-center gap-2 bg-jur-blue-800 text-jur-gold-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-jur-blue-700"><Sparkles size={14} /> IA</button>
            <button onClick={handleBookmark} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${currentQ.isMarkedForReview ? 'bg-jur-gold-500 text-jur-blue-950 border-jur-gold-500' : 'bg-jur-blue-800 border-jur-blue-700 text-slate-400'}`}><Bookmark size={14} /> {currentQ.isMarkedForReview ? "Salva" : "Revisar"}</button>
        </div>
      </div>
      <div className="w-full bg-jur-blue-800 h-2 rounded-full mb-8 overflow-hidden"><div className="bg-jur-gold-500 h-full transition-all duration-500" style={{ width: `${((currentIndex) / questions.length) * 100}%` }}></div></div>
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg md:text-xl lg:text-2xl font-serif leading-relaxed text-white mb-8">{currentQ.enunciado}</h3>
        <div className="space-y-4 mb-8">
          {currentQ.options.map((opt, idx) => {
            let stateClass = "border-jur-blue-800 bg-jur-blue-900 text-slate-300 hover:border-jur-blue-600";
            if (isAnswered) { if (idx === currentQ.correctAnswerIndex) stateClass = "border-emerald-500 bg-emerald-900/20 text-emerald-100"; else if (idx === selectedOption) stateClass = "border-red-500 bg-red-900/20 text-red-100"; else stateClass = "border-jur-blue-800 bg-jur-blue-900/50 text-slate-500"; } else if (selectedOption === idx) stateClass = "border-jur-gold-500 bg-jur-blue-800 text-white";
            return (
              <button key={idx} disabled={isAnswered || savingAnswer} onClick={() => handleAnswer(idx)} className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 group ${stateClass}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${isAnswered && idx === currentQ.correctAnswerIndex ? 'border-emerald-500 bg-emerald-500 text-jur-blue-950' : isAnswered && idx === selectedOption ? 'border-red-500 text-red-500' : 'border-slate-500 group-hover:border-slate-300'}`}>{isAnswered && idx === currentQ.correctAnswerIndex ? <CheckCircle size={14} /> : isAnswered && idx === selectedOption ? <XCircle size={14} /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}</div><span className="text-base">{opt}</span>
              </button>
            )
          })}
          {isAnswered && <button onClick={handleTeacherComment} className="w-full mt-4 bg-jur-gold-500/10 border border-jur-gold-500 text-jur-gold-500 p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-jur-gold-500/20 transition-all shadow-glow"><Lightbulb size={20} /> Ver Comentário do Professor</button>}
        </div>
      </div>
      <div className="mt-6 flex justify-end"><button onClick={nextQuestion} disabled={!isAnswered} className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${isAnswered ? 'bg-jur-gold-500 text-jur-blue-950 hover:bg-jur-gold-400' : 'bg-jur-blue-800 text-slate-500 cursor-not-allowed'}`}>{currentIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'} <ChevronRight size={18} /></button></div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.AUTH);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        
        if (data) {
             const rawStats = {
                acertos_constitucional: data.acertos_constitucional || 0,
                acertos_administrativo: data.acertos_administrativo || 0,
                acertos_licitacoes: data.acertos_licitacoes || 0,
                acertos_servidores: data.acertos_servidores || 0,
                acertos_penal: data.acertos_penal || 0,
                erro_constitucional: data.erro_constitucional || 0,
                erro_administrativo: data.erro_administrativo || 0,
                erro_licitacao_contrato: data.erro_licitacao_contrato || 0,
                erro_servidores: data.erro_servidores || 0,
                erro_penal: data.erro_penal || 0
             };

             const topicStats: Record<string, TopicStat> = {};
             
             const getStat = (acertos: number, erros: number) => ({ correct: acertos, answered: acertos + erros });

             topicStats['Direito Constitucional'] = getStat(rawStats.acertos_constitucional, rawStats.erro_constitucional);
             topicStats['Direito Administrativo'] = getStat(rawStats.acertos_administrativo, rawStats.erro_administrativo);
             topicStats['Licitações e Contratos'] = getStat(rawStats.acertos_licitacoes, rawStats.erro_licitacao_contrato);
             topicStats['Servidores Públicos'] = getStat(rawStats.acertos_servidores, rawStats.erro_servidores);
             topicStats['Direito Penal'] = getStat(rawStats.acertos_penal, rawStats.erro_penal);

             let currentLevelIdx = 0;
             const userXP = data.pontos || 0;
             for (let i = 0; i < LEVELS.length; i++) {
                 if (userXP >= LEVELS[i].minXP) currentLevelIdx = i;
             }

             const newUser: UserProfile = {
                 id: data.id,
                 name: data.username || 'Usuário',
                 email: data.email, 
                 phone: data.phone,
                 address: data.address,
                 xp: userXP,
                 level: currentLevelIdx,
                 questionsAnswered: (data.total_acertos || 0) + (data.total_erros || 0),
                 correctAnswers: data.total_acertos || 0,
                 streak: 0, 
                 bookmarkedQuestions: [],
                 history: [], 
                 topicStats: topicStats,
                 rawProfileStats: rawStats
             };
             setUser(newUser);
        }
    } catch (e) {
        console.error("Error loading profile", e);
    } finally {
        setLoadingUser(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
        if (gameState === GameState.AUTH) setGameState(GameState.DASHBOARD);
      } else {
        setLoadingUser(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (!user || user.id !== session.user.id) {
             await loadUserProfile(session.user.id);
        }
        if (gameState === GameState.AUTH) setGameState(GameState.DASHBOARD);
      } else {
        setUser(null);
        setGameState(GameState.AUTH);
      }
    });
    return () => subscription.unsubscribe();
  }, [gameState, user]); 

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setGameState(GameState.AUTH);
      setUser(null);
  };

  if (loadingUser) {
      return (
        <div className="min-h-screen bg-jur-blue-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-jur-gold-500 animate-spin" />
        </div>
      );
  }

  if (gameState === GameState.AUTH || !user) {
      return <AuthScreen onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-jur-blue-950 overflow-hidden font-sans">
       <Sidebar activeState={gameState} onChangeState={setGameState} onLogout={handleLogout} />
       <main className="flex-1 overflow-hidden relative flex flex-col">
            {gameState === GameState.DASHBOARD && user && <Dashboard user={user} onStartQuiz={() => setGameState(GameState.SETUP_QUIZ)} />}
            {gameState === GameState.SETUP_QUIZ && <QuizSetup onStart={(cfg) => { setQuizConfig(cfg); setReviewQuestions([]); setGameState(GameState.PLAYING); }} />}
            {gameState === GameState.EXAM_SETUP && <ExamSetup onStart={(cfg) => { setQuizConfig(cfg); setReviewQuestions([]); setGameState(GameState.PLAYING); }} />}
            {gameState === GameState.CANDIDATE_AREA && user && <CandidateArea user={user} onUpdateProfile={(updates) => setUser(u => u ? ({...u, ...updates}) : null)} />}
            {gameState === GameState.REVIEW_LIST && user && <ReviewList userId={user.id} onStartReview={(qs) => { setReviewQuestions(qs); setQuizConfig({ count: qs.length, topics: [], areas: [] }); setGameState(GameState.PLAYING); }} />}
            {gameState === GameState.PLAYING && user && (
                <QuizSession 
                    config={quizConfig || { count: 10, topics: [], areas: [] }} 
                    user={user}
                    onFinish={() => { setGameState(GameState.DASHBOARD); setQuizConfig(null); setReviewQuestions([]); }}
                    onUpdateUser={() => loadUserProfile(user.id)}
                    onOpenChat={(ctx) => { setChatContext(ctx); setIsChatOpen(true); }}
                    preloadedQuestions={reviewQuestions.length > 0 ? reviewQuestions : undefined}
                    isReviewMode={reviewQuestions.length > 0}
                />
            )}
       </main>
       <ChatBot isOpen={isChatOpen} setIsOpen={setIsChatOpen} context={chatContext} />
    </div>
  );
};

export default App;