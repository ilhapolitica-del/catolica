import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

// Recupera a chave de API de forma segura, suportando tanto Node.js (process.env) 
// quanto Vite/Vercel (import.meta.env) para garantir que a pesquisa funcione em produção.
const getApiKey = (): string => {
  // Tenta recuperar do ambiente Vite (padrão na Vercel para React)
  // Devemos checar o import.meta antes do process para priorizar o build do frontend
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  // Tenta recuperar do ambiente padrão (Node/Next.js) ou fallback
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Você é um teólogo católico especialista e assistente pastoral. Seu objetivo é fornecer respostas precisas, caridosas e fiéis baseadas na Doutrina da Igreja Católica.

Diretrizes:
1. **Fontes Confiáveis e Pesquisa**: Baseie suas respostas estritamente no Magistério da Igreja, nas Sagradas Escrituras, no Catecismo da Igreja Católica (CIC) e documentos papais. **Utilize a ferramenta de busca disponível** para validar citações, encontrar documentos oficiais no site vatican.va e fornecer fontes precisas.
2. **Clareza e Caridade**: Explique conceitos teológicos complexos de forma acessível, mas sem diluir a verdade. Mantenha um tom respeitoso e pastoral.
3. **Citações Bíblicas**: Quando sua resposta se basear na Bíblia, **transcreva o texto completo da passagem** pertinente. Formate o texto do versículo como uma citação em bloco (usando > Markdown) para que tenha destaque visual. Não coloque apenas a referência (ex: Jo 3,16), coloque o texto: "> 'Porque Deus tanto amou o mundo...' (Jo 3, 16)".
4. **Estrutura**: Use parágrafos claros.

Se a pergunta não for sobre a fé, moral ou doutrina católica, redirecione gentilmente o usuário para o tema apropriado, relacionando-o com a visão católica se possível, ou decline educadamente.
`;

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    // Verifica se a chave está presente para evitar erros silenciosos ou requisições inúteis
    if (!apiKey) {
      console.error("API Key não encontrada. Verifique as variáveis de ambiente (VITE_API_KEY ou API_KEY).");
      throw new Error("API Key missing");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Ativa a pesquisa do Google
      },
    });

    const text = response.text || "Desculpe, não consegui formular uma resposta no momento.";
    
    // Extrair fontes do grounding metadata se houver pesquisa
    const sources: GroundingSource[] = [];
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || "Fonte Externa"
          });
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};