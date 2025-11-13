import { GoogleGenAI } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
     },
    });

    const text = response.text || "Desculpe, não consegui formular uma resposta no momento.";
    
    // Como a pesquisa foi desativada, não haverá fontes externas dinâmicas
    const sources: GroundingSource[] = [];

    return { text, sources };

  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};
