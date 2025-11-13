import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

// Função segura para recuperar a chave de API em diferentes ambientes de build (Vite, CRA, etc)
const getApiKey = (): string => {
  // Verifica se está rodando em ambiente Vite (padrão Vercel para React moderno)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || "";
  }
  // Fallback para ambientes que usam process.env
  try {
    return process.env.REACT_APP_API_KEY || process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Você é um teólogo católico especialista e assistente pastoral. Seu objetivo é fornecer respostas precisas, caridosas e fiéis baseadas na Doutrina da Igreja Católica.

Diretrizes:
1. **Fontes Confiáveis e Pesquisa**: Baseie suas respostas estritamente no Magistério da Igreja, nas Sagradas Escrituras, no Catecismo da Igreja Católica (CIC) e documentos papais. **Utilize a ferramenta de busca disponível** para validar citações, encontrar documentos oficiais no site vatican.va e fornecer fontes precisas.
2. **Clareza e Caridade**: Explique conceitos teológicos complexos de forma acessível, mas sem diluir a verdade. Mantenha um tom respeitoso e pastoral.
3. **Estrutura**: Use parágrafos claros. Se citar o Catecismo ou a Bíblia, forneça a referência (ex: CIC 1234, Jo 3, 16).

Se a pergunta não for sobre a fé, moral ou doutrina católica, redirecione gentilmente o usuário para o tema apropriado, relacionando-o com a visão católica se possível, ou decline educadamente.
`;

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; sources: GroundingSource[] }> => {
  try {
    // Check if key is missing before calling to provide a clearer error
    if (!apiKey) {
      throw new Error("A chave de API não está configurada. Na Vercel, adicione a variável de ambiente 'VITE_API_KEY' com sua chave do Google AI Studio.");
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