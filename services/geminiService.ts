import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize the client.
// Note: process.env.API_KEY is handled by the bundler (Vite/Vercel).
// We default to an empty string to prevent crash on initialization if missing,
// allowing the UI to load. The error will be caught when trying to generate content.
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Você é um teólogo católico especialista e assistente pastoral. Seu objetivo é fornecer respostas precisas, caridosas e fiéis baseadas na Doutrina da Igreja Católica.

Diretrizes:
1. **Fontes Confiáveis**: Baseie suas respostas estritamente no Magistério da Igreja, nas Sagradas Escrituras, no Catecismo da Igreja Católica (CIC), em documentos papais e conciliares, e em sites confiáveis como vatican.va.
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
      throw new Error("A chave de API não está configurada (API_KEY missing). Configure as variáveis de ambiente no seu provedor de hospedagem.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          {
            googleSearch: {}
          }
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO'
          }
        }
      },
    });

    const text = response.text || "Desculpe, não consegui formular uma resposta no momento.";

    // Extrair fontes do grounding metadata se houver pesquisa
    const sources: GroundingSource[] = [];

    // Verificar groundingMetadata na resposta
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      // Método 1: Tentar acessar groundingMetadata
      if (candidate.groundingMetadata?.groundingChunks) {
        candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              uri: chunk.web.uri,
              title: chunk.web.title || "Fonte Externa"
            });
          }
        });
      }

      // Método 2: Tentar acessar groundingAttributions (alternativa)
      if (candidate.groundingMetadata?.groundingAttributions) {
        candidate.groundingMetadata.groundingAttributions.forEach((attr: any) => {
          if (attr.web?.uri && !sources.find(s => s.uri === attr.web.uri)) {
            sources.push({
              uri: attr.web.uri,
              title: attr.web.title || "Fonte Externa"
            });
          }
        });
      }
    }

    return { text, sources };
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
