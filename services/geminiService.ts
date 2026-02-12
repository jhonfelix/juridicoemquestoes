import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, QuestionDifficulty, DbCategory } from '../types';
import { TOPIC_TO_DB, MOCK_QUESTION } from '../constants';

// Fallback logic for demo if no key is present
const hasKey = !!process.env.API_KEY;

export const generateQuestions = async (
  topics: string[], 
  areas: string[], 
  count: number, 
  difficulty: QuestionDifficulty,
  bancas: string[] = [],
  orgaos: string[] = []
): Promise<Question[]> => {
  if (!hasKey) {
    console.warn("No API_KEY found. Returning mock data.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Array.from({ length: count }).map((_, i) => {
      // Rotate topics for mock data
      const topic = topics.length > 0 ? topics[i % topics.length] : 'Direito Administrativo';
      const dbCat = TOPIC_TO_DB[topic] || 'administrativo';
      
      return {
        ...MOCK_QUESTION,
        id: `mock-${Date.now()}-${i}`,
        topic: topic,
        dbCategory: dbCat,
        enunciado: `(Dados de Teste - API Key não configurada) ${i + 1}. Esta é uma questão simulada sobre ${topic} nível ${difficulty}. Para questões reais, configure a API_KEY.`,
        // Ensure strictly required fields are present overrides
        options: MOCK_QUESTION.options,
        correctAnswerIndex: MOCK_QUESTION.correctAnswerIndex,
        explanation: MOCK_QUESTION.explanation,
        banca: bancas.length > 0 ? bancas[0] : 'Simulada',
        orgao: orgaos.length > 0 ? orgaos[0] : 'Geral'
      } as Question;
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Strictly typed schema for the response
  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        enunciado: { type: Type.STRING, description: "O texto da questão (enunciado)." },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "4 alternativas de resposta."
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "Índice da resposta correta (0-3)." },
        explanation: { type: Type.STRING, description: "Explicação jurídica sucinta do gabarito." },
        subtopic: { type: Type.STRING, description: "O subtema específico da questão (ex: Atos Administrativos)." },
        disciplina: { 
          type: Type.STRING, 
          enum: Object.keys(TOPIC_TO_DB),
          description: "A qual disciplina esta questão pertence." 
        },
        area: {
            type: Type.STRING,
            description: "A área do concurso (ex: Administrativa, Policial, Judiciária)."
        },
        banca: { type: Type.STRING, description: "Banca organizadora simulada (ex: Cebraspe, FGV)." },
        orgao: { type: Type.STRING, description: "Órgão simulado (ex: PF, TJ-SP)." }
      },
      required: ["enunciado", "options", "correctAnswerIndex", "explanation", "subtopic", "disciplina"],
    },
  };

  const topicsStr = topics.length > 0 ? topics.join(', ') : "Diversos temas jurídicos (Constitucional, Administrativo, Penal)";
  const areasStr = areas.length > 0 ? areas.join(', ') : "Áreas variadas (Administrativa, Policial, Judiciária)";
  const bancasStr = bancas.length > 0 ? bancas.join(', ') : "Qualquer grande banca (FGV, Cebraspe, FCC)";
  const orgaosStr = orgaos.length > 0 ? orgaos.join(', ') : "Qualquer órgão público";

  const prompt = `
    Gere ${count} questões de concurso público inéditas ou adaptadas.
    Disciplinas: ${topicsStr}.
    Áreas de Concurso: ${areasStr}.
    Bancas (Estilo): ${bancasStr}.
    Órgãos (Foco): ${orgaosStr}.
    Nível de dificuldade: ${difficulty}.
    Foco: Precisão técnica jurídica.
    Estilo: Similar a bancas como FGV, Cebraspe ou FCC.
    Para cada questão, identifique claramente a 'disciplina' exata conforme a lista fornecida, bem como a banca e órgão simulados.
    Retorne apenas o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Good balance for variety and precision
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Transform into app's Question type
    return rawData.map((q: any, index: number) => {
      // Map back to DB category. Fallback to first selected topic's category if AI hallucinates a key.
      const mappedDbCategory = TOPIC_TO_DB[q.disciplina] || TOPIC_TO_DB[topics[0]] || 'administrativo';
      
      return {
        id: `gen-${Date.now()}-${index}`,
        topic: q.disciplina || (topics.length > 0 ? topics[0] : 'Geral'),
        dbCategory: mappedDbCategory,
        subtopic: q.subtopic,
        enunciado: q.enunciado,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        difficulty: difficulty,
        area: q.area || 'Geral',
        banca: q.banca || 'Simulada',
        orgao: q.orgao || 'Geral'
      };
    });

  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  if (!hasKey) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Estou operando em modo de demonstração (sem API Key). Em produção, eu usaria o Gemini-3-Pro para tirar suas dúvidas sobre a questão!";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      config: {
        systemInstruction: "Você é o JurisBot, um tutor jurídico de elite especializado em Direito Constitucional e Administrativo para concursos públicos. Suas respostas devem ser diretas, didáticas e estritamente embasadas na Constituição Federal de 1988 e na doutrina majoritária. Seja prestativo para ajudar o aluno a entender o erro ou acerto na questão.",
      },
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Não consegui formular uma resposta no momento.";

  } catch (error: any) {
    console.error("Chat Error:", error);
    return "Desculpe, tive um problema ao conectar com o servidor jurídico. Tente novamente.";
  }
};

export const generateStudyHint = async (topic: string, questionText: string): Promise<string> => {
    if (!hasKey) return "**Fundamentação Legal:** CF/88, Art. 37.\n\n**Análise da Resposta Correta:** A administração deve obedecer aos princípios de Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.\n\n**Análise das Alternativas Incorretas:**\n- As demais opções citam princípios de direito privado ou inexistentes.";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Atue como um Professor Especialista em Concursos Jurídicos da área de ${topic}.
      Questão para comentar: "${questionText}"
      
      Gere um comentário didático e altamente estruturado.
      Use EXATAMENTE a seguinte estrutura (com os títulos em negrito):
      
      **Fundamentação Legal e Doutrinária**
      (Cite a Lei, Artigo, Súmula ou Doutrina aplicável de forma direta)
      
      **Análise da Resposta Correta**
      (Explique por que o gabarito é o correto de forma didática)
      
      **Análise das Alternativas Incorretas**
      (Analise brevemente o erro das demais opções, se necessário use tópicos)
      
      Mantenha o tom profissional e direto. Use espaçamento duplo entre os tópicos.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });
        return response.text?.trim() || "Consulte a legislação pertinente ao tema.";
    } catch (e) {
        console.error("Hint Generation Error", e);
        return "Não foi possível gerar o comentário no momento.";
    }
}